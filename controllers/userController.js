const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Speciality = require("../models/speciality");


/* =========================
   SIGNUP 
========================= */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, speciality, phone, country } = req.body;

    if (!name || !email ||  !speciality || !phone || !country || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedSpeciality =
      speciality.trim().replace(/\b\w/g, c => c.toUpperCase());
      const { validatePassword, passwordErrorMessage } = require("../utils/passwordValidator");

    if (!validatePassword(password)) {
      return res.status(400).json({ message: passwordErrorMessage });
    }

    let existsSpeciality = await Speciality.findOne({
      name: normalizedSpeciality
    });

    if (!existsSpeciality) {
      await Speciality.create({ name: normalizedSpeciality });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      phone,
      country,
      speciality: normalizedSpeciality,
      password: hashedPassword,
      role: "user",
      isActive: true,
      points: 0,     
    });

    res.status(201).json({ message: "User created successfully" });

  } catch (error) {
    //console.error("Signup error:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};


/* =========================
   LOGIN
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    });
  } catch (error) {
    //console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/* =========================
   GET USERS (ADMIN)
========================= */
exports.getUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10, isActive } = req.query;

    const query = {
      name: { $regex: search, $options: "i" },
    };

    if (isActive !== undefined) {
      query.isActive = isActive === "true"; // Convert string to boolean
    }

    const users = await User.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    //console.error("getUsers error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/* =========================
   UPDATE USER (ADMIN)
========================= */
exports.updateUser = async (req, res) => {
  try {
    const { name, phone, country, isActive, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (country !== undefined) user.country = country;
    if (isActive !== undefined) user.isActive = isActive;

    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.mustChangePassword = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    //console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   GET USER BY SPECIALITY (ADMIN)
========================= */
exports.getUsersBySpeciality = async (req, res) => {
  try {
    const { specialities } = req.query;

    // console.log("Incoming specialities:", specialities);

    if (!specialities || specialities.trim() === "") {
      return res.json({ users: [] }); // return empty if nothing selected
    }

    const specialityArray = specialities.split(",");

    const users = await User.find({
      speciality: { $in: specialityArray }
    }).select("-password");

    // console.log("Filtered users:", users.length);

    res.json({ users });

  } catch (error) {
    //console.error("Filter error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/* =========================
  Create User by Admin (with mustChangePassword flag)
========================= */
exports.createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, speciality, phone, country, role } = req.body;

     if (!name || !email || (role !== "admin" && !speciality) || !phone || !country || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let normalizedSpeciality = null;

if (role !== "admin") {
  normalizedSpeciality =
    speciality.trim().replace(/\b\w/g, c => c.toUpperCase());

  let existsSpeciality = await Speciality.findOne({
    name: normalizedSpeciality
  });

  if (!existsSpeciality) {
    await Speciality.create({ name: normalizedSpeciality });
  }
} else {
  normalizedSpeciality = "admin"; // or null if you prefer
}

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔐 ROLE CONTROL STARTS HERE
    let assignedRole = "user";

    // 🚫 Nobody can create SUPER_ADMIN
    if (role === "super_admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 🟡 Admin → only USER
    if (req.user.role === "admin") {
      assignedRole = "user";
    }

    // 🔴 Super Admin → USER or ADMIN
    else if (req.user.role === "super_admin") {
      assignedRole = role === "admin" ? "admin" : "user";
    }

    const user = await User.create({
      name,
      email,
      phone,
      country,
      speciality: normalizedSpeciality,
      password: hashedPassword,
      role: assignedRole,
      isActive: true,
      points: 0,
      mustChangePassword: true
    });

    res.status(201).json({ message: "User created successfully", user });

  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE USER ROLE (ADMIN)
========================= */


const updateUserRole = async (req, res) => {
  try {
    // 🔐 Step 1 — Check SUPER ADMIN
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can change roles" });
    }

    const { role } = req.body;

    // 🧠 Safety check (no nonsense roles)
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    res.json({
      message: "Role updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserRole = updateUserRole;



