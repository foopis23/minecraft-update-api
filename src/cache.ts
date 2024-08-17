import NodeCache from 'node-cache';
export const cache = new NodeCache({ stdTTL: 900 }); // 15 minutes

