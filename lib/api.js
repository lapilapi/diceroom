﻿//============================================
// requires
//============================================
const schema	= require('./db/schema.js');
const mongoose	= require('mongoose');
const timezone	= require('timezone/loaded');
const sanitize  = require('validator').sanitize;

//============================================
// db settings
//============================================
const MONGO_URL = process.env.MONGOLAB_URI;
mongoose.connect(MONGO_URL);
const LotTable = mongoose.model('Message');

//============================================
// application behavior implementation
//============================================
exports.api = {
	'lot_list': function(req,  callback, config) {
		var lot_lines = {"list": new Array()};
		LotTable.find(
			{view_flg: true, delete_flg: false}, 
			null, 
			{limit: req.query.count, skip:req.query.offset, sort: {'update_dt': -1}}, 
			function(error, docs){
				if(!error) {
					for (var i=0; i<docs.length; ++i) {
						lot_lines.list.push({
							"id": docs[i].id,
							"lot": docs[i].lot,
							"message": docs[i].message,
							"hash": docs[i].hash,
							"regist_dt": _date_to_string(docs[i].regist_dt),
							"update_dt": _date_to_string(docs[i].update_dt)
						});
					}
					callback(JSON.stringify(lot_lines), 200);
				} else {
					callback(JSON.Stringify({"error":"ロットデータの取得に失敗しました"}), 400);
				}
			}
		);
	},
	'lot': function(req,  callback, config) {
		var message = req.query.message;

		if (message.length == 0) {
			callback(JSON.Stringify({"error": "必要なデータが存在しません"}), 400);
		}

		const lot_result = _do_lot(
			config.default_lot_min, 
			config.default_lot_max
		);
		{
			var lot_table = new LotTable();
			lot_table.message = sanitize(message).entityEncode();
			lot_table.lot = lot_result;
			lot_table.save(function(error){
				if (error) {
					callback(JSON.Stringify({"error":"データベースへの登録が失敗しました"}), 400);
				}
				LotTable.find(
					{view_flg: true, delete_flg: false}, 
					null, 
					{limit: 1, sort: {'update_dt': -1}}, 
					function(error, docs){
						if(!error) {
							callback(JSON.stringify({
								"id": docs[0].id,
								"lot": docs[0].lot,
								"message": docs[0].message,
								"hash": docs[0].hash,
								"regist_dt": _date_to_string(docs[0].regist_dt),
								"update_dt": _date_to_string(docs[0].update_dt)
							}), 200);
						} else {
							callback(JSON.Stringify({"error": "データベース登録後の参照に失敗しました"}), 400);
						}
					}
				);
			});
		}

	},
	'reference': function(req, callback, config) {
		// this callback function are not implemented yet
		callback(JSON.stringify(""), 200);
	}
}

//============================================
// local methods
//============================================
// 乱数生成はXorshift 128bitを用いています.周期は2^128-1でDiehard testを通過している乱数です.
// xorshift : http://ja.wikipedia.org/wiki/Xorshift
// Diehard tests : http://en.wikipedia.org/wiki/Diehard_tests
//
// 初期値にgetTimeで取得したunixtimeを渡すやり方だと,
// 上位ビットが固定されるため安定性に問題があります.
// seed初期化後の乱数の安定化処理についてはこちらを参考にしています.
// http://d.hatena.ne.jp/gintenlabo/20100925/1285432088
// http://d.hatena.ne.jp/gintenlabo/20100926/1285521107
// http://homepage1.nifty.com/herumi/diary/1009.html#26
// http://d.hatena.ne.jp/gintenlabo/20100928/1285702435
// http://d.hatena.ne.jp/gintenlabo/20100930/1285859540
// エントリ中でrotateについて述べられていますが, JSの型の扱いを考えると面倒くさいため,
// 40回の空回しで対処を行っています.
function XorShift128(seed) {
	this.x = 123456789;
	this.y = 362436069;
	this.z = 521288629;
	this.w = seed;
	
	this.stabilization_trials = 40;
	this.Stabilization();
}

XorShift128.prototype.Generate = function() {
	var t = this.x ^ (this.x << 11);
	this.x = this.y;
	this.y = this.z;
	this.z = this.w;
	
	this.w = (this.w ^ (this.w >> 19)) ^ (t ^ (t >> 8));
	
	return this.w;
}

XorShift128.prototype.Stabilization = function() {
	for (var i=0; i<this.stabilization_trials; ++i) {
		this.Generate();
	}
}

// Date.nowをseedとし, min-max間の擬似乱数を生成します
function _do_lot(min, max)
{
	const date	= new Date();
	const seed	= date.getTime();

	var xor128 = new XorShift128(seed);
	return ((xor128.Generate() % max) + min);		
}

function _date_to_string(date)
{
	var jst_datetime = timezone(date, '%Y-%m-%d %H:%M:%S', 'ja_JP', 'Asia/Tokyo');
	return jst_datetime;
}

