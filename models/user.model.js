const { Schema, model, models } = require("mongoose");
const {hash} = require('bcrypt')



const userSchema = new Schema(
  {

    name: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    bio: {
      type: String,
    },

    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },

  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("save", async function(next){ 

  if(!this.isModified("password")) return next();

  this.password = await hash(this.password, 10)
})

const User = models.User || model("User", userSchema);

module.exports = User