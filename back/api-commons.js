exports.apiCommons = {
    /**
     * @param {express.Response} res
     * @param {string} message
     * @param {number=} statusCode = 400
     */
    sendError(res, message, statusCode = 400) {
        res.status(statusCode).send({err: message});
    }
};
