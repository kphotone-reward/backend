const Speciality = require('../models/speciality');

exports.getSpecialities = async (req, res) => {

    try {
        const {search} = req.query;
        let query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }   

        const specialities = await Speciality.find(query).limit(10);
        res.json({ specialities });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};