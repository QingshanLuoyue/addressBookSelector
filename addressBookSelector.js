/*
* 通讯录选择
* autor ljf
*/
;
(function($, window, document) {
    // var imgid = 'img/64.jpg';
    $.fn.addressBookSelector = function(options) {
        if (methods[options]) {
            return methods[options].apply(this, Array.prototype.slice.call(arguments, 1))
        } else if (typeof options === 'object' || !options) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + options + 'does not exist on Select.js');
        }
    }
    $.fn.addressBookSelector.defaults = {
        select_box: '.select-box', // 选择框外层盒子
        wrapper: '.wrapper', // 发送框外层
        accepter_res_list: '.accepter-res-list', // 最终显示结果列表
        accepter_list: '.accepter-list', // 暂存选择的结果列表
        input_tips: '.input-tips', // 提示信息的input
        js_input: '.js-input', // 最终要提交的input
        js_picker: '.js-picker', // 添加成员按钮-->点击显示选择框
        js_select_all: '.js-select-all', // 全选按钮
        js_crumbs: '.js-crumbs', // 面包屑导航
        js_item_list: '.js-item-list', // 查询出来的部门/成员列表
        pick_confirm: '.pick-confirm', // 确定已经选择的结果按钮
        pick_close: '.pick-close', // 关闭选择框
        party_url: '', // 获取部门接口
        member_url: '', // 获取成员接口
        historyBackData: '', // 数据反推
        isMoblie: false,
        partyImgurl : 'https://res.wx.qq.com/mmocbiz/zh_CN/tmt/pc/dist/img/icon-organization-24_714a2dc7.png',

    };

    var methods = $.fn.addressBookSelector.methods = {
        init: function(options) {
            return this.each(function() {

                var $this = $(this);
                var opt = this.opt = $.extend({}, $.fn.addressBookSelector.defaults, util, options);
                opt.mailData, opt.memberData;
                // 面包屑导航
                opt.queryList = [];
                opt.crumbsStr = '', opt.itemStr = '';
                opt.sendId = []; // 发送框中的id
                opt.cacheId = []; // 每次显示选择框时，由sendId初始值

                opt.$select_box = $this.find(opt.select_box); // 选择框外层盒子

                opt.$js_item_list = $this.find(opt.js_item_list); // 查询出来的部门/成员列表

                opt.$js_crumbs = $this.find(opt.js_crumbs); // 面包屑导航

                opt.$accepter_list = $this.find(opt.accepter_list); // 暂存选择的结果列表

                opt.$accepter_res_list = $this.find(opt.accepter_res_list); // 最终显示结果列表

                opt.$pick_confirm = $this.find(opt.pick_confirm); // 确定已经选择的结果按钮

                opt.$pick_close = $this.find(opt.pick_close); // 关闭选择框

                opt.$js_picker = $this.find(opt.js_picker); // 添加成员按钮-->点击显示选择框

                opt.$js_select_all = $this.find(opt.js_select_all); // 全选按钮

                opt.$input_tips = $this.find(opt.input_tips); // 提示信息的input

                opt.$js_input = $this.find(opt.js_input); // 最终要提交的input

                opt.$wrapper = $this.find(opt.wrapper); // 结果外层

                $.ajax({
                    // url: '{% url "company:getpartylist" %}',
                    url: opt.party_url,
                    type: 'get',
                    async: false,
                    success: function(data) {
                        // console.log(data)
                        var json = JSON.parse(data)
                        opt.mailData = json.party_list.list;
                    }
                })

                if (opt.historyBackData.length != 0) {
                    opt.historyback(opt);
                }
                opt.initHtml(opt);
                methods.bindParty(opt);
                methods.bindCrumbs(opt);
                methods.bindCheckbox(opt);
                methods.bindSelectedDelteItem(opt);
                !opt.isMoblie && methods.bindResultDelteItem(opt);
                methods.bindConfirm(opt);
                methods.bindClose(opt);
                methods.bindAdd(opt);
                methods.bindAll(opt);
            })
        },

        /***************   点击目录与点击面包屑导航  *****************/
        // 绑定点击部门事件
        bindParty: function(opt) {
            opt.$js_item_list.on('click', '.js-item-name', function() {
                var curPartyId = $(this).parent().attr('data-id');
                var dataType = $(this).parent().attr('data-type');
                var isChecked = $(this).siblings('input').prop('checked');
                if (dataType == 'party') {
                    opt.productItem(curPartyId, isChecked, opt);
                }

            })
        },
        // 绑定点击导航事件
        bindCrumbs: function(opt) {
            opt.$js_crumbs.on('click', '.js-navi-name', function() {
                var curPartyId = $(this).attr('data-id');
                var isChecked = $(this).data('checked');
                opt.productItem(curPartyId, isChecked, opt);
            })
        },

        /****************   点击选中与删除  ********************/
        // 绑定点击点击checkbox选中/删除item事件
        bindCheckbox: function(opt) {
            opt.$js_item_list.on('click', '.js-item-checkbox', function() {
                var dataType = $(this).parent().attr('data-type');
                var curPartyId = $(this).parent().attr('data-id');
                var itemName = $(this).siblings('.js-item-name').text();
                var imgid = $(this).siblings('img').attr('src');
                var isChecked = $(this).prop('checked');
                var param = {
                    itemName: itemName,
                    imgid: imgid,
                    dataType: dataType,
                }
                isChecked ? opt.addItem(curPartyId, param, opt.accepter_list, opt.$accepter_list, opt) : opt.delItem(curPartyId, opt.accepter_list, opt.$accepter_list, opt);
            })
        },
        // 绑定点击选择框中  -- 点击删除item事件
        bindSelectedDelteItem: function(opt) {
            opt.$accepter_list.on('click', '.input-delete', function() {
                var curPartyId = $(this).parent().attr('data-id');
                opt.delItem(curPartyId, opt.accepter_list, opt.$accepter_list, opt);
                for (var i = 0; i < opt.queryList.length; i++) {
                    if (opt.queryList[i].party_id == curPartyId) {
                        opt.productItem(opt.queryList.pop().party_id, false, opt);
                    }
                }
                opt.$js_item_list.find('.js-item-line[data-id=' + curPartyId + ']').children('input').prop('checked', false);
            })
        },
        // 绑定点击发送框中  -- 点击删除item事件
        bindResultDelteItem: function(opt) {
            opt.$accepter_res_list.on('click', '.input-delete', function() {
                var curPartyId = $(this).parent().attr('data-id');
                opt.delItem(curPartyId, opt.accepter_res_list, opt.$accepter_res_list, opt);
                opt.setInputVal(opt);
                if (opt.$accepter_res_list.children().size() == 0) {
                    opt.$wrapper.removeClass('select-all');
                    opt.$js_picker.removeClass('isClick');
                }
            })
        },

        /********************  确定与关闭  *********************/
        // 绑定点击确定事件
        bindConfirm: function(opt) {
            opt.$pick_confirm.on('click', function() {
                opt.$select_box.toggle();

                opt.$accepter_res_list.find('.input-item').remove()
                opt.$accepter_res_list.append(opt.$accepter_list.find('.input-item').clone())

                opt.tips(opt.$accepter_res_list, opt);
                opt.sendId = opt.deepCopy(opt.cacheId); // 将选中的id与sendId合并
                opt.cacheId = [];

                opt.setInputVal(opt);

            })
        },
        // 绑定点击关闭事件
        bindClose: function(opt) {
            opt.$pick_close.on('click', function() {
                opt.$select_box.toggle();
            })
        },

        /**********************   点击进行成员选择  ***********************/
        // 绑定点击添加成员按钮  + 按钮 显示选择框事件
        bindAdd: function(opt) {
            opt.$js_picker.on('click', function () {
                if (!$(this).hasClass('isClick')) {
                    opt.$select_box.toggle();
                    opt.cacheId = opt.deepCopy(opt.sendId);
                    opt.initHtml(opt)
                    opt.$accepter_list.find('.input-item').remove()
                    opt.$accepter_list.append(opt.$accepter_res_list.find('.input-item').clone())
                    opt.tips(opt.$accepter_list, opt); //modify
                }
            })
        },

        /**************************   点击全选  ***************************/
        // 绑定点击全选事件
        bindAll: function(opt) {
            opt.$js_select_all.on('click', function () {
                opt.$accepter_res_list.find('.input-item').remove();
                if ($(this).parent().hasClass('select-all')) { // 可选状态
                    $(this).parent().removeClass('select-all');
                    opt.$js_picker.removeClass('isClick');
                    for (var i = 0;i < opt.sendId.length;i++) {
                        opt.delItem(opt.sendId[i], opt.accepter_res_list, opt.$accepter_res_list, opt);
                    }
                    opt.$accepter_res_list.html('');
                    opt.sendId = [];
                } else { // 全选状态
                    $(this).parent().addClass('select-all');
                    opt.$js_picker.addClass('isClick');
                    var sendIdArr = util.queryDirectory(0,opt);
                    var param = {
                        dataType: 'party'
                    }
                    opt.sendId = [];
                    for (var i = 0;i < sendIdArr.length;i++) {
                        opt.sendId.push('p' + sendIdArr[i].party_id);
                        param['itemName'] = sendIdArr[i].name;
                        param['dataType'] = 'party';
                        opt.addItem(sendIdArr[i].party_id, param, opt.accepter_res_list, opt.$accepter_res_list, opt)

                    }
                }
                opt.setInputVal(opt)
            })
        }
    }

    var util = $.fn.addressBookSelector.util = {
        // 数据反推
        historyback: function (opt) {
            var tempParamp = opt.historyBackData['party_list'];
            var tempParamm = opt.historyBackData['contact_list'];
            var paramP = {dataType: 'party'}
            var paramM = {dataType: 'member'}
            for (var i = 0; i < tempParamp.length; i++) {
                paramP['itemName'] = tempParamp[i].name;
                opt.addItem(tempParamp[i].party_id, paramP, opt.accepter_res_list, opt.$accepter_res_list, opt)
                opt.sendId.push('p'+tempParamp[i].party_id)
            }
            for (var i = 0; i < tempParamm.length; i++) {
                paramM['itemName'] = tempParamm[i].name;
                paramM['imgid'] = tempParamm[i].imgid;
                opt.addItem(tempParamm[i].worker_id, paramM, opt.accepter_res_list, opt.$accepter_res_list, opt)
                opt.sendId.push('m'+tempParamm[i].worker_id)
            }

        },
        initHtml: function(opt) {
            // 初始化选择器页面
            var directoryData = util.queryDirectory(0, opt); // 获取 "0/全部" 目录下的 "部门/成员" 列表
            opt.reuseProductItemMethod(directoryData, 'party', 'party_id', opt); // 生成"部门/成员"列表
            opt.$js_item_list.html(opt.itemStr);
            util.selectItem(opt)
            opt.itemStr = '';
        },

        // ajax获取成员数据
        getMemberData: function(curPartyId, opt,url) {
            var jsonData;
            $.ajax({
                // url: '{% url "company:get_party_contacts" %}?party_id=' + curPartyId,
                url: url + '?party_id=' + curPartyId,
                type: 'get',
                async: false,
                success: function (res) {
                    var json = JSON.parse(res)
                    jsonData = json.contact_list.list;
                }
            })
            return jsonData;
        },

        // 查询目录结构
        queryDirectory: function(curPartyId, opt) {
            var directoryArr = []
            for (var i = 0; i < opt.mailData.length; i++) {
                if (opt.mailData[i].parent_id == curPartyId) {
                    directoryArr.push(opt.mailData[i])
                }
            }
            return directoryArr;
        },

        // 生成item的html复用函数
        reuseProductItemMethod: function(acceptData, dataType, idType, opt) {
            if (opt.isMoblie) {
                for (var i = 0, len = acceptData.length; i < len; i++) {
                    opt.itemStr += '<div class="yui_cell js-item-line" data-type="' + dataType + '" data-id="' + acceptData[i][idType] + '">\
                                    <input type="checkbox" ' + (acceptData[i].is_locked ? 'disabled' : '') + ' class="yui_check js-item-checkbox">\
                                    <i class="yui_icon_checked iconfont" style="margin:-1px 5px 0 0;"></i>'
                    if (dataType == 'party') {
                        opt.itemStr += '<i class="icon-folder"></i>'
                    } else {
                        opt.itemStr += '<img class="js-item-img" src="' + acceptData[i].imgid + '">'
                    }
                    opt.itemStr += '<span class="js-item-name">' + acceptData[i].name + '</span>\
                            </div>'
                }
            } else {
                for (var i = 0, len = acceptData.length; i < len; i++) {
                    opt.itemStr += '<div class="js-item-line" data-type="' + dataType + '" data-id="' + acceptData[i][idType] + '">\
                                    <img class="js-item-img" style="width:24px;height: 24px;" src="' + (dataType == 'party' ? opt.partyImgurl : acceptData[i].imgid) + '">\
                                    <span class="js-item-name">' + acceptData[i].name + '</span>\
                                    <input type="checkbox" ' + (acceptData[i].is_locked ? 'disabled' : '') + ' class="js-item-checkbox">\
                                </div>'
                }
            }
        },

        // 生成结果item
        productItem: function(curPartyId, isChecked, opt) {
            if (curPartyId != 0) {
                util.isHasChild(curPartyId, opt);
            }
            var directoryData = util.queryDirectory(curPartyId, opt);
            opt.reuseProductItemMethod(directoryData, 'party', 'party_id', opt);
            if (opt.memberData) {
                opt.reuseProductItemMethod(opt.memberData, 'member', 'worker_id', opt);
            }
            opt.memberData = [];
            if (opt.itemStr == '') {
                opt.$js_item_list.html('<div style="margin-top: 20px; margin-left: 40%">没有成员</div>');
            } else {
                opt.$js_item_list.html(opt.itemStr);
                opt.itemStr = '';
            }
            if (isChecked) {
                opt.$js_item_list.find('.js-item-checkbox').prop({
                    "checked": true,
                    "disabled": true
                })
            }
            util.productCrumbs(curPartyId, opt); // 位置必须在最下面
            util.toTop(opt)
        },

        // 获取面包屑路径数组
        getQueryList: function(curPartyId, opt) {
            for (var i = 0; i < opt.mailData.length; i++) {
                if (opt.mailData[i].party_id == curPartyId) {
                    opt.queryList.unshift(opt.mailData[i])
                    if (opt.mailData[i].parent_id != 0) {
                        util.getQueryList(opt.mailData[i].parent_id, opt)
                    }
                }
            }
        },

        // 生成面包屑结构
        productCrumbs: function(curPartyId, opt) {
            opt.queryList = [];
            util.getQueryList(curPartyId, opt);
            if (curPartyId == 0) {
                opt.crumbsStr += '全部'
            } else {
                opt.crumbsStr += '<a href="javascript:;" class="js-navi-name" data-type="top" data-id="0">全部</a>\
                                    <span class="crumbs-span">&gt;</span>'
                for (var i = 0, len = opt.queryList.length; i < len; i++) {
                    if (i == len - 1) {
                        opt.crumbsStr += opt.queryList[i].name;
                    } else {
                        opt.crumbsStr += '<a href="javascript:;" class="js-navi-name" data-type="party" data-id="' + opt.queryList[i].party_id + '">' + opt.queryList[i].name + '</a>\
                                    <span class="crumbs-span">&gt;</span>'
                    }
                }
            }
            opt.$js_crumbs.html(opt.crumbsStr);
            opt.crumbsStr = '';
            util.selectItem(opt)
            opt.$js_crumbs.find('.js-navi-name').each(function() {
                for (var i = 0; i < opt.cacheId.length; i++) {
                    if ($(this).attr('data-id') == opt.cacheId[i]) {
                        $(this).data('checked', true);
                    }
                }
            })
        },

        // 向结果栏添加item
        addItem: function (curPartyId, param, selector, $selector, opt) {
            var str = '';
            if (opt.isMoblie) {
                str += '<span class="input-item" data-id="' + curPartyId + '">\
                        <span class="input-delete">'
                        if (param.dataType == 'party') {
                            str += '<i class="icon-folder"></i>'
                        } else {
                            str += '<img style="width:18px;height: 18px;position:relative;top: -2px;margin-right:2px" src="' + param.imgid + '">'

                        }
                        str+=       '<span class="input-item-text">' + param.itemName + '</span>\
                        </span>\
                    </span>'
            } else {
                str += '<li class="input-item" data-id="' + curPartyId + '">\
                            <img class="input-item-icon" src="' + (param.dataType == 'party' ? opt.partyImgurl : param.imgid) + '">\
                            <span class="input-item-text">' + param.itemName + '</span>\
                            <i class="input-delete input-item-close-icon"></i>\
                        </li>'
            }
            $selector.append(str);

            if (selector == opt.accepter_list) {
                util.pushCacheId(opt.cacheId, curPartyId, param.dataType);
            }
            util.tips($selector, opt);
        },

        // 从结果栏删除item
        delItem: function (curPartyId, selector, $selector, opt) {
            $selector.find('[data-id=' + curPartyId + ']').remove();
            if (curPartyId == 0) {
                opt.$wrapper.removeClass('select_all').children(opt.js_picker).removeClass('isClick')
            }
            if (selector == opt.accepter_res_list) {
                util.delCacheId(opt.sendId, curPartyId);
            } else if (selector == opt.accepter_list) {
                util.delCacheId(opt.cacheId, curPartyId);
            }
            util.tips($selector, opt);
        },

        // 通过cacheId选中item
        selectItem: function(opt) {
            for (var i = 0, len = opt.cacheId.length; i < len; i++) {
                opt.$js_item_list.find('.js-item-line[data-id=' + opt.cacheId[i].slice(1) + ']').children('input').prop('checked', true);
            }
        },

        // 是否显示提示
        tips: function($selector, opt) {
            if ($selector.children().size() != 0) {
                $selector.show()
                $selector.siblings(opt.input_tips).hide()
            } else {
                $selector.hide()
                $selector.siblings(opt.input_tips).show()
            }
        },

        // 添加缓存id
        pushCacheId: function(idArr, curPartyId, dataType) {
            if (dataType == 'party') {
                idArr.push("p" + curPartyId)
            } else {
                idArr.push("m" + curPartyId)
            }
        },

        // 删除缓存id
        delCacheId: function(idArr, curPartyId) {
            for (var i = 0, len = idArr.length; i < len; i++) {
                if (idArr[i].slice(1) == curPartyId) {
                    idArr.splice(i, 1);
                    break;
                }
            }
        },

        // 判断是否有member成员
        isHasChild: function(curPartyId, opt) {
            var flag = false;
            for (var i = 0, len = opt.mailData.length; i < len; i++) {
                if (opt.mailData[i].party_id == curPartyId) {
                    flag = opt.mailData[i].has_child;
                    break;
                }
            }
            if (flag) {
                opt.memberData = util.getMemberData(curPartyId, opt, opt.member_url)
            }
        },

        // 设置input的值
        setInputVal: function(opt) {
            var pId = [],
                mId = [];
            for (var i = 0; i < opt.sendId.length; i++) {
                if (opt.sendId[i].slice(0, 1) == 'p') {
                    pId.push(opt.sendId[i].slice(1))
                } else if (opt.sendId[i].slice(0, 1) == 'm') {
                    mId.push(opt.sendId[i].slice(1))
                }
            }
            var d = {
                "party_list": pId,
                "contact_list": mId
            }
            if (opt.sendId.length != 0) {
                opt.$js_input.val(JSON.stringify(d))
            } else {
                opt.$js_input.val('')
            }
            // console.log('这是发送的input的值：' + opt.$js_input.val())
        },

        //  一层深拷贝
        deepCopy: function(copyObj) {
            var targetObj = [];
            for (var i = 0; i < copyObj.length; i++) {
                targetObj[i] = copyObj[i]
            }
            return targetObj;
        },

        //  结果list框返回顶部
        toTop: function(opt) {
            opt.$js_item_list.scrollTop(0)
        },
    }
})(jQuery, window, document)
