const storeMiddleware = function(store) {
  return function (req, res, next) {
    req.timerStore = store;
    next();
  }
}

module.exports = {
	storeMiddleware
}