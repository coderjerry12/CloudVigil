/**
 * Standard API response builder with CORS headers.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

function success(body, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

function error(message, statusCode = 400) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ message }),
  };
}

function notFound(message = 'Resource not found') {
  return error(message, 404);
}

function forbidden(message = 'Not authorized') {
  return error(message, 403);
}

function serverError(message = 'Internal server error') {
  return error(message, 500);
}

module.exports = { success, error, notFound, forbidden, serverError };
