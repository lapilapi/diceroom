const mongoose	= require('mongoose');
const crypto	= require('crypto');
const schema	= mongoose.Schema;

function MD5Hex(src) 
{
    var md5 = crypto.createHash('md5');
    md5.update(src, 'utf8');
    return md5.digest('hex');
}

function CreateID()
{
	const date = new Date();
	return MD5Hex(String(date.getTime()));
}

// create identification number
function CreateIdentificationNumber()
{
	const slice_begin = 0;
	const slice_end	  = 6;
	return CreateID().slice(slice_begin, slice_end);
}

const message_schema = new schema({
	id:			{type: String, default: CreateID, index: true},
	lot:		{type: Number, default: 0},
	message:	{type: String, default: ""},
	hash:		{type: String, default: CreateIdentificationNumber},
	regist_dt:	{type: Date, default: Date.now},
	update_dt:	{type: Date, default: Date.now},
	delete_flg: {type: Boolean, default: false},
	view_flg:	{type: Boolean, default: true}
});

mongoose.model('Message', message_schema);
