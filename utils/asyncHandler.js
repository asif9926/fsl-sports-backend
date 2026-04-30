const asyncHandler = (fn) => {
    return async function asyncWrapper(req, res, next) {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error); // কোনো এরর হলে সরাসরি গ্লোবাল এরর হ্যান্ডলারে পাঠিয়ে দেবে
        }
    };
};

module.exports = asyncHandler;