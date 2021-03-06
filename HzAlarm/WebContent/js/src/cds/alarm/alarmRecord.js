define(["echarts","vue","frm/loginUser","frm/hz.db","frm/message","frm/datepicker","frm/dialog","frm/treeSelect","frm/select"],function(chart,tpl,login,db,tip,t,dialog,tree){
	var tables=document.getElementById("tableshow");
	var count=0,time=flag=true;

	var model=new tpl({
		el:'#record',
		data:{
			records:[],
			total:'0',
			done:'0',
			wait:'0',
			plc:'',
			alarm:{
				'day':'',
				'cus':login.cusNumber,
				'type':'',
				'result':'',
				'plc':'',
				'org':login.sysAdmin==1||login.dataAuth!=0?login.cusNumber:login.deptId,
			},
			today:(function(){var date = new Date();return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()})()
		},
		watch:{
			today:function(val,old){
				model.alarm['day']=val;
				conditionQuery(val);
				time=false;
			},
			'alarm.type':function(val,old){
				val.length&&conditionQuery(model.alarm,true);
			},
			'alarm.result':function(val,old){
				val.length&&conditionQuery(model.alarm,true);
			},
			'alarm.plc':function(val,old){
				val.length&&conditionQuery(model.alarm,true);
			}
		},
		methods:{
			query:function(e){
				if(validate()){
					tip.alert('请选择查询条件');
					return;
				}		
				conditionQuery(model.alarm,true);
			},
			reset:function(){
				if(validate()){
					return;
				}
				model.alarm['type']='';
				model.alarm['result']='';
				model.alarm['plc']='';
				model['plc']='';
				conditionQuery(model.alarm,true);
			}
		}
	});
	conditionQuery(model.today);
	//时间线
	function query(pageindex,flag){
		//时间轴数据
		db.query({
			request:{
				sqlId:'select_alaram_record_byday',
				params:model.alarm,
				whereId:(flag||!validate())&&'1',
				orderId:'0',
				pageIndex:pageindex,
				pageSize:20
			},
			success:function(data){
				model.total=count=data.count;
				model.records=flag?data.data:model.records.concat(data.data);
			}
		});
	}
	//报警器查询
	var timer=null,key;
	//滚动事件
	var direction=0;
	document.getElementById("scroll").onscroll=function(e){
		//滚动条高度
		var scroll=this.clientHeight*this.clientHeight/this.scrollHeight;
		//滚动条距离顶部高度
		var top=(this.clientHeight*this.scrollTop)/this.scrollHeight;
		//距离底部的高度
		var l=this.clientHeight-(scroll+top),f=l<direction;
		direction= l;
		if(f&&l<1){//判断滚动方向小于乡下
			if(model.total==this.childElementCount){
				tip.alert("没有了");
				return;
			}
			this.childElementCount>=20&&query(parseInt(this.childElementCount/20)+1,false);
		}
	};
	var line={
        	lineStyle:{
        		color:'rgb(255, 255, 255)'
        	}
        };
	var options = {
			legend:{
				left:'0px'
			},
            title: {
                text: '时间段',
                textStyle:{
		        	fontSize: 11,
		        	color: '#fff'		        	
		        }
            },
            tooltip: {
            },
            xAxis: {
                data: (function(){
                	var data=[];
                	for(var i=0;i<24;i++){
                		data.push({value: (i<10?('0'+i):i)+':00',textStyle:{fontSize:4}});
                	}
                	return data;
                })(),
                axisLine:line
            },
            yAxis: {
            	axisLine:line
            },
            series: {
            	name:'报警次数',
                type: 'bar'
            }
        };

	//条件查询
	function conditionQuery(date,f){
		    query(1,true);
			//一天中各个时间点的报警次数
			db.query({
				request:{
					sqlId:'select_alarm_record_bytime',
					params:model.alarm,//[date,login.cusNumber],
					orderId:'0',
					whereId:f&&'1'
				},
				success:function(data){
					options.series.data=data[0].r&&data[0].r.split(",");
					chart.init(tables.nextElementSibling).setOption(options);
				}
			});
			//按照报警类型查询
			db.query({
				request:{
					sqlId:'select_alarm_record_bytype',
					params:model.alarm,
					orderId:'0',
					whereId:f&&'1'
				},
				success:function(arr){
					var d=[{"name":"摄像机","value":64},{"name":"网络","value":5}];
					chart.init(tables).setOption({
						 title : {
						        text: '报警设备类型',
						        left:'left',
						        textStyle:{
						        	fontSize: 11,
						        	color: '#fff'		        	
						        },
						        x:'center'
						    },
					    tooltip:{},
					    series : [
					              {
					                  name: '报警来源',
					                  type: 'pie',
					                  radius: '55%',
					                  data:arr.length?JSON.parse(JSON.stringify(arr)):[{name:'暂无数据'}]
					              }
					          ]
		          });
			   }
			});
			//报警已处理情况
			db.query({
				request:{
					sqlId:'select_alarm_result_byday',
					params:model.alarm,
					orderId:f&&'0',
					whereId:'1'
				},success:function(data){
					setTimeout(function(){
						model.wait=data[0]?data[0]['sum']:'0';
						model.done=(model.total-model.done)>0?(model.total-model.done):'0';
					},300);
					
				}
			});
	}
	//用户树
	db.query({
		request:{
			sqlId:'select_plc_by_orgid',
			params:{'org':login.cusNumber,'level':(login.dataAuth!=2)?'2':'3'}
		},success:function(data){
			var setting={
					key:'name',
					diyClass:'conditionslid',
					expand:true,
					path:'../../../libs/ztree/css/zTreeStyle/img/',
					data: {simpleData: {enable: true,pIdKey: "pid"}},
					callback:{
						onClick:function(e,id,node){
							if(node.type==1){	
								model.plc=node.name;
								model.alarm['plc']=node.id;
							}else{
								tip.alert("请选择刷卡人");
							}
						}
					}
			};
			tree.init("plcTree",setting,keepLeaf(data));
		}
	});
	function keepLeaf(list){
		var leaf=[];
		//获取子元素
		for(var i=0;i<list.length;i++){
			if(list[i]['type']==1){
				leaf.push(list.splice(i,1)[0]);
				i--;
			}
		}
		var pid=[];
		//获取父元素id
		for(var j=0;j<leaf.length;j++){
			if(pid.indexOf(leaf[j]['pid'])<0){
				pid.push(leaf[j]['pid'])
			}
		}
		var treeArray=[];
		//搜索父级元素
		var searchP=function(pid){
			for(var i=0;i<list.length;i++){
				if(list[i]['id']==pid){
					var temp=list.splice(i,1)[0];
					treeArray.push(temp);
					searchP(temp['pid']);
					i--;
				}
			}
		};
		//根据父id搜索
		for(var l=0;l<pid.length;l++){
			searchP(pid[l]);
		}
		return treeArray.concat(leaf);
	}
	
	function validate(){
		return !model.alarm['plc'].length&&!model.alarm['type'].length&&
		!model.alarm['result'].length;
	}
});