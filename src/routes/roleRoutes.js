const roleRoutes = {
  pilgrim: '/dashboard',
  volunteer: '/volunteer/dashboard',
  medical: '/medical/dashboard',
  police: '/controller/dashboard',
  municipality: '/municipality/dashboard',
};

export const getHomeRoute = (roleId) => roleRoutes[roleId] || '/dashboard';

export const isValidRole = (roleId) => !!roleRoutes[roleId];

export default roleRoutes;
