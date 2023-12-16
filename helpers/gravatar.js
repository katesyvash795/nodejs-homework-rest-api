import crypto from 'crypto';

function generateAvatarUrl(emailAddress, options = {}) {
	const defaultImage = options.defaultImage || 'identicon';
	const emailHash = crypto.createHash('md5').update(emailAddress).digest('hex');
	return `https://www.gravatar.com/avatar/${emailHash}?d=${defaultImage}`;
}

export default generateAvatarUrl;