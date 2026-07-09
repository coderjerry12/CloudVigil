/**
 * Extract user info from Cognito JWT claims in API Gateway event.
 */
function getUserFromEvent(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
    return null;
  }

  return {
    userId: claims.sub,
    email: claims.email,
    name: claims.name || claims.email,
    role: claims['custom:role'] || 'attendee',
  };
}

module.exports = { getUserFromEvent };
