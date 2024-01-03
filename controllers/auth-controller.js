import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Jimp from 'jimp';
import { nanoid } from "nanoid";
import {generateAvatarUrl} from '../helpers/index.js';

import User from "../models/User.js";

import { ctrlWrapper } from "../decorators/index.js";

import { HttpError } from "../helpers/index.js";

const { JWT_SECRET } = process.env;

const signup = async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email });
	if (user) {
		throw new HttpError(409, 'Email in use');
	}

	const hashPassword = await bcrypt.hash(password, 10);
    const verificationToken = nanoid();
	const avatar = generateAvatarUrl(email, {
		defaultImage: 'monsterid',
	});

	const newUser = await User.create({
		...req.body,
		password: hashPassword,
		avatarUrl: avatar,
        verificationToken,
	});

    const verifyEmail = {
        to: email,
        subject: "Сonfirm your registration",
        html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click to confirm your registration</a>`,
      };
    
      await sendEmail(verifyEmail);
    
  res.status(201).json({
    user: { email: result.email, subscription: result.subscription },
  });
};
  
const verify = async (req, res) => {
    const { verificationToken } = req.params;
  
    const user = await User.findOne({ verificationToken });
  
    if (!user) {
      throw HttpError(404, "User not found");
    }
  
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: "",
    });
  
    res.json({
      message: "Verification successful",
    });
  };

  const resendVerify = async (req, res) => {
    const { email } = req.body;
  
    const user = await User.findOne({ email });
    if (!user) {
      throw HttpError(404, "User not found");
    }
  
    if (user.verify) {
      throw HttpError(400, "Verification has already been passed");
    }
  
    const verifyEmail = {
      to: email,
      subject: "Сonfirm your registration",
      html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click to confirm your registration</a>`,
    };
  
    await sendEmail(verifyEmail);
  
    res.json({
      message: "Verification email sent",
    });
  };

const signin = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        throw HttpError(401, "Email or password invalid");
    }
    if (!user.verify) {
        throw HttpError(401, "User not found");
      }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
        throw HttpError(401, "Email or password invalid");
    }

    const payload = {
        id: user._id,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
    await User.findByIdAndUpdate(user._id, {token});

    res.json({
        token,
    })
}

const getCurrent = async (req, res) => {
    const { username, email } = req.user;

    res.json({
        username,
        email,
    })
}

const signout = async(req, res)=> {
    const {_id} = req.user;
    await User.findByIdAndUpdate(_id, {token: ""});

    res.json({
        message: "Signout success"
    })
}

const updateSubscription = async (req, res) => {
    const { _id: owner } = req.user;
    const { subscription } = req.body;
  
    const result = await User.findByIdAndUpdate(
      owner,
      { subscription },
      { new: true }
    );
  
    if (!result) {
      throw HttpError(404, "Not found");
    }
  
    res.json(result);
  };

const updateAvatar = async (req, res) => {
	const { _id } = req.user;

	const { path: oldPath, filename } = req.file;

	const image = await Jimp.read(oldPath);
	image.resize(250, 250);
	await fs.rename(oldPath, path.join(avatarsPath, filename));
	await image.write(path.join(avatarsPath, filename));

	const avatarUrl = path.join('avatars', filename);

	const updatedUser = await User.findByIdAndUpdate(_id, { avatarUrl }, { new: true });

	if (!updatedUser) {
		throw new HttpError(401, `Not authorized`);
	}

	res.status(200).json({ avatarUrl });
};

export default {
    verify: ctrlWrapper(verify),
  resendVerify: ctrlWrapper(resendVerify),
    signup: ctrlWrapper(signup),
    signin: ctrlWrapper(signin),
    getCurrent: ctrlWrapper(getCurrent),
    signout: ctrlWrapper(signout),
    updateAvatar:ctrlWrapper(updateAvatar),
    updateSubscription: ctrlWrapper(updateSubscription),
}