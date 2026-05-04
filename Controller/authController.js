const User = require('../Model/User/user');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.register = async (req, res) => {
    try {
        const newUser = await User.create({
            email: req.body.email,
            password: req.body.password,
            role: req.body.role,
            profile: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone
            }
        });

        const token = signToken(newUser._id);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new Error('Please provide email and password');
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            throw new Error('Incorrect email or password');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = signToken(user._id);

        res.status(200).json({
            status: 'success',
            token
        });
    } catch (err) {
        res.status(401).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        console.log('🔐 Protect middleware - Token received:', token ? 'YES' : 'NO');

        if (!token) {
            throw new Error('You are not logged in. Please log in to get access.');
        }

        console.log('🔐 Verifying token with JWT_SECRET...');
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        console.log('🔐 Token decoded successfully. User ID:', decoded.id);
        
        const user = await User.findById(decoded.id);
        console.log('🔐 User found in database:', user ? 'YES' : 'NO');

        if (!user) {
            throw new Error('The user belonging to this token no longer exists.');
        }

        // Check if user is deleted or blocked instead of isActive
        if (user.isDelete) {
            throw new Error('This user account has been deleted.');
        }

        if (user.isBlock) {
            throw new Error('This user account has been blocked.');
        }

        console.log('🔐 User authenticated successfully:', user._id);
        req.user = user;
        next();
    } catch (err) {
        console.error('🔐 Protect middleware error:', err.message);
        res.status(401).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
