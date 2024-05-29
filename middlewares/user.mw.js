const User = require('../models/user.model.js')

const verifySignUpBody = async (req, res, next) => {

   const {name, password, bio, username} = req.body

    try{
    if(!name) return res.status(400).send("Please provide the name")
    if(!password) return res.status(400).send("Please provide the password")
    if(!bio) return res.status(400).send("Please provide the bio")
    if(!username) return res.status(400).send("Please provide the username")
     const finduser = await User.findOne({username : req.body.username})
    if(finduser) return res.status(400).send("User with this userid is already present")
    next()
    }catch(err){
    return  res.status(404).send(`Error while fetching the req body ${err}`)
}
}

const verifyLoginBody = async (req, res, next) => {

  const {password, username} = req.body

  if (!password)
    return res.status(400).send("Please provide the password");
  if (!username)
    return res.status(400).send("Please provide the username");
  next();
};

module.exports = {
  verifySignUpBody,
  verifyLoginBody,
};