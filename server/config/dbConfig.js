const mongoose = require("mongoose");


mongoose.connect(process.env.mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose;