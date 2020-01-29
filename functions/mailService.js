const nodemailer = require("nodemailer");

/**
 * @description The service function that sends mail
 * @param {Object} req the request object
 * @param {String} req.from senders email address
 * @param {string} req.to recievers email address
 * @param {String} req.subject email subject
 * @param {String} req.message the content of the email
 * @returns {Object} a JSON object
 * @throws {Error} Any error that prevents the service from executing successfully
 */
exports.send = (req, res, data) => {
  const { user, pass } = data;
  const { from, to, subject, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  const mailOptions = {
    from,
    to,
    subject,
    html: `<p style="font-size: 22px;">${message}</p>`
  };
  return transporter.sendMail(mailOptions, (erro, info) => {
    if (erro) {
      return res.status(500).send({
        success: false,
        error: erro.toString()
      });
    }
    return res.send({
      success: true,
      error: null
    });
  });
}

export default mailService;