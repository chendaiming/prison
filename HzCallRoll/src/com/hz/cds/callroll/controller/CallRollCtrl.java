package com.hz.cds.callroll.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.hz.cds.callroll.service.CallRollHandleService;


@RequestMapping("callRoll")
@Controller
public class CallRollCtrl {
	// 日志
		private static final Logger log = LoggerFactory.getLogger(CallRollCtrl.class);
	@Autowired
	private CallRollHandleService callRollHandleService;

	@RequestMapping("start")
	@ResponseBody
	public JSONObject start (@RequestParam() String args) {
		JSONObject reqJSON = JSON.parseObject(args);
		log.debug("点名调用,传入的参数："+reqJSON);

		return reqJSON;
	}
	
	public static void main(String[] args) {
		
	}
}
