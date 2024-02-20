import fs from 'fs/promises';
import { spawn } from 'child_process';
import { logger } from '../utils/logger';
import formidable from 'formidable';
import {
    newHailpadScan,
    setHailpadScanStatus,
    setScanStatus,
    updateHailpadScanLocation,
    updateScanLocation
} from '../db';
import { ScanType } from 'database';
import { Worker } from 'node:worker_threads';
import path from 'path';

const isWindows = process.platform === 'win32';

type HailpadJobData = {
    user_id: string;
    folder_name?: string;
    file: formidable.File;
};

type HailpadJob = HailpadJobData & {
    scan_id: string;
    worker: Worker;
};

const workers: HailpadJob[] = [];

export const handleMeshUpload = async ({
    user_id,
    folder_name,
    file
}: HailpadJobData) => {
    const scan = await newHailpadScan({
        user_id: user_id,
        scan_location: file.originalFilename?.split('.')[0] ?? '',
        scan_size: file.size
    });

    const scan_id = scan.id;

    try {
        await updateHailpadScanLocation({
            scan_id,
            location: folder_name ?? scan_id,
        });

        // Create a temporary file path
        try {
            await fs.mkdir(`./meshes/${folder_name ?? scan_id}`, {
                recursive: true,
            });
            await fs.copyFile(
                file.filepath,
                `./meshes/${folder_name ?? scan_id}/${file.originalFilename
                }`
            );
            await fs.rm(file.filepath);
        } catch (err) {
            logger.error(`Error creating directory ${folder_name ?? scan_id}`);
            logger.error(err);
        }

        const file_path = `./meshes/${folder_name ?? scan_id}/${file.originalFilename
            }`;

        // Add to queue
        const worker = new Worker(
            path.resolve(
                __dirname,
                process.env.NODE_ENV === 'production'
                    ? './hailpad_analysis_worker.js'
                    : './hailpad_analysis_worker.ts'
            ),
            {
                workerData: {
                    input: file_path,
                    output: `./meshes/${folder_name ?? scan_id}/output`,
                },
            }
        );

        worker.on('message', (result) => {
            (async () => {
                try {
                    try {
                        await fs.rm(file_path);
                    } catch (err) {
                        logger.error(`Error deleting file ${file_path}`);
                        logger.error(err);
                    }

                    if (result !== 0 || typeof result !== 'number') {
                        await setHailpadScanStatus({
                            scan_id,
                            status: 'FAILED',
                        });

                        throw new Error('Hailpad analysis failed');
                    } else {
                        await setHailpadScanStatus({
                            scan_id,
                            status: 'COMPLETED',
                        });
                    }
                } catch (err) {
                    logger.error(err);
                } finally {
                    // Remove from queue
                    const index = workers.findIndex(
                        (worker) => worker.scan_id === scan_id
                    );

                    worker.terminate();

                    if (index !== -1) {
                        workers.splice(index, 1);
                    }
                }
            })();
        });

        workers.push({
            user_id,
            folder_name,
            file,
            scan_id,
            worker,
        });
    } catch (err) {
        await setHailpadScanStatus({
            scan_id,
            status: 'FAILED',
        });

        throw new Error('Failed to process mesh');
    }

    return scan_id;
};

export const hailpadAnalysis = async (input: string, output: string) => {
    const hailpadAnalysisPath = isWindows
        ? './hailgen/HailpadAnalysis.exe'
        : './hailgen/HailpadAnalysis';

    return await new Promise((resolve, reject) => {
        const hailpadAnalysisProcess = spawn(hailpadAnalysisPath, [
            input,
            '-o',
            output,
        ]);

        hailpadAnalysisProcess.stderr.on('data', (data) => {
            logger.error(`Hailpad analysis error: ${data}`);
            return reject(data);
        });

        hailpadAnalysisProcess.on('exit', (code) => {
            if (code !== 0) {
                logger.error(`Hailpad analysis exited with code ${code}`);
                return reject(code);
            }

            logger.success(
                `Hailpad analysis successfully rendered ${input} into ${output}`
            );
            return resolve(code);
        });
    });
};
