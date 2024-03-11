import { hailpadAnalysis } from './hailpad_analysis';
import { logger } from '../../utils/logger';
import { parentPort, workerData } from 'node:worker_threads';

const { input, output } = workerData;

(async () => {
	try {
		parentPort?.postMessage(await hailpadAnalysis(input, output));
	} catch (err) {
		logger.error(err);
		parentPort?.postMessage({ error: err });
	}
})();
