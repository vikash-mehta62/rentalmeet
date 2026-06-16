const dns = require('dns');

const DEFAULT_MONGODB_DNS_SERVERS = ['1.1.1.1', '8.8.8.8'];

const parseServers = (value) =>
  (value || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

const isLoopbackServer = (server) =>
  ['127.0.0.1', '127.0.0.1:53', '::1', '[::1]', '[::1]:53'].includes(server);

const configureMongoDns = (mongoUri = '') => {
  if (!mongoUri.startsWith('mongodb+srv://')) return;

  const envServers = parseServers(process.env.MONGODB_DNS_SERVERS);
  if (envServers.length > 0) {
    dns.setServers(envServers);
    return;
  }

  const currentServers = dns.getServers();
  if (currentServers.length === 0 || currentServers.every(isLoopbackServer)) {
    dns.setServers(DEFAULT_MONGODB_DNS_SERVERS);
  }
};

module.exports = configureMongoDns;
