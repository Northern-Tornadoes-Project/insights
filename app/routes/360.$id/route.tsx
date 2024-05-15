import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export function loader({ params }: LoaderFunctionArgs) {
	const { id } = params;

	return {
		id
	};
}

export default function View360() {
    const { id } = useLoaderData<typeof loader>();

    return (
        <div>
            <h1>360 View {id}</h1>
        </div>
    );
}
