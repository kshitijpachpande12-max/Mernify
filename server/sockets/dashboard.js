const { verifyAnyJwt } = require('../middleware/auth');
const stats = require('../services/stats');

function setupDashboardNamespace(io) {
  const ns = io.of('/dashboard');

  // Auth by JWT
  ns.use((socket, next) => {
    const token =
      socket.handshake.auth.token ||
      (socket.handshake.headers.authorization || '').replace('Bearer ', '');
    if (!token) return next(new Error('Missing token'));

    const decoded = verifyAnyJwt(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }
    socket.user = { id: decoded.id, email: decoded.email };
    next();
  });

  ns.on('connection', (socket) => {
    stats.setConnectedDashboard(ns.sockets.size);

    socket.on('subscribe', (data) => {
      if (!data) return;
      if (typeof data === 'string') {
        socket.join(data);
        return;
      }
      if (typeof data === 'object') {
        const { projectId, services } = data;
        if (!projectId) return;

        // Join project-level room
        socket.join(`project:${projectId}`);
        if (projectId === 'proj_demo') {
          socket.join('project:proj_demo');
        }

        // If specific services are given, join each service room
        if (Array.isArray(services) && services.length > 0) {
          for (const svc of services) {
            socket.join(`project:${projectId}:service:${svc}`);
            if (projectId === 'proj_demo') {
              socket.join(`project:proj_demo:service:${svc}`);
            }
          }
        }
      }
    });

    socket.on('unsubscribe', (data) => {
      if (!data) return;
      if (typeof data === 'string') {
        socket.leave(data);
        return;
      }
      if (typeof data === 'object') {
        const { projectId, services } = data;
        if (!projectId) return;

        socket.leave(`project:${projectId}`);
        if (projectId === 'proj_demo') {
          socket.leave('project:proj_demo');
        }
        if (Array.isArray(services) && services.length > 0) {
          for (const svc of services) {
            socket.leave(`project:${projectId}:service:${svc}`);
            if (projectId === 'proj_demo') {
              socket.leave(`project:proj_demo:service:${svc}`);
            }
          }
        }
      }
    });

    socket.on('disconnect', () => {
      stats.setConnectedDashboard(ns.sockets.size);
    });
  });

  return ns;
}

module.exports = { setupDashboardNamespace };
