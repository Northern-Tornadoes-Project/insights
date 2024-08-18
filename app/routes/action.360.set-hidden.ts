import { paths } from '~/db/schema';
import { createHiddenAction } from '~/lib/set-hidden-action';

export const action = createHiddenAction(paths);
