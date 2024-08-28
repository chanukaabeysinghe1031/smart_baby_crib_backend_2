import mongoose from "mongoose";

const ecbAINannySchema = new mongoose.Schema(
  {
    etlDateTime: { type: Date, default: Date.now },
    etlSequenceNo: { type: Number },
    sysUserId: { type: Number, required: true },
    threadId: { type: Number, required: true },
    sysUserFedFirstName: { type: String },
    userFedQuestion: { type: String },
    userFedVQuestion: { type: String },
    sysResponse: { type: String },
  },
  { timestamps: true }
);

let autoIncrement = 1;

ecbAINannySchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      if (this.userFedQuestion && this.userFedVQuestion) {
        return next(
          new Error(
            "Only one of userFedQuestion or userFedVQuestion should be provided"
          )
        );
      }

      const docs = await this.constructor
        .find()
        .sort({ etlSequenceNo: -1 })
        .limit(1);
      if (docs.length > 0) {
        autoIncrement = docs[0].etlSequenceNo + 1;
      }
      this.etlSequenceNo = autoIncrement;

      next();
    } catch (err) {
      return next(err);
    }
  } else {
    next();
  }
});

const ecbAINanny = mongoose.model("EcbAINanny", ecbAINannySchema);

export default ecbAINanny;
