import mongoose from "mongoose";
import bcrypt from "bcrypt";

const ecbUserRegisterationSchema = new mongoose.Schema(
  {
    etlDateTime: { type: Date, default: Date.now },
    etlSequenceNo: { type: Number },
    sysUserId: { type: Number, required: true },
    userFedParentFirstName: { type: String, required: true },
    userFedFirstName: { type: String, required: true },
    userFedBirthWeight: { type: Number, required: true },
    userFedBirthHeight: { type: Number, required: true },
    userFedBirthTempr: { type: Number, required: true },
    userFedBabyAge: { type: Number, required: true },
    userFedBabyGender: { type: String, enum: ["M", "F"], required: true },
    userFedStrollerModelNo: { type: String, required: true },
    userFedEmailAddress: { type: String, required: true },
    userFedPassword: { type: String, required: true },
    passwordResetCode: { type: Number },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

ecbUserRegisterationSchema.pre("save", async function (next) {
  if (this.isModified("userFedPassword") || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(this.userFedPassword, salt);
      this.userFedPassword = hash;
      next();
    } catch (err) {
      next(err);
    }
  }

  if (this.isNew) {
    try {
      const lastEntry = await this.constructor
        .findOne({ sysUserId: this.sysUserId })
        .sort({ etlSequenceNo: -1 });
      if (lastEntry) {
        this.etlSequenceNo = lastEntry.etlSequenceNo + 1;
      } else {
        this.etlSequenceNo = 1; // Start from 1 if no previous records are found for this user
      }
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

const ecbUserRegisteration = mongoose.model(
  "EcbUserRegisteration",
  ecbUserRegisterationSchema
);

export default ecbUserRegisteration;
