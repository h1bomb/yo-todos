# todos

这个项目主要用于yo的使用和教学。

将会建立多个分支阐述创建一个todo list的过程。

### 编写JS前端逻辑
前端需要操作服务端的todo的内容，并且展现，主要是增删查改这些操作，同时绑定相关的事件。这个例子里面使用jquery和pjax等，所以需要在`client`下的`package.json`,添加依赖包：
```javascript
  "spm": {
    "main": "index.js",
    "dependencies": {
      "jquery": "1.8.3",
      "jquery-pjax-183": "1.0.0",
      "nprogress-183": "0.1.6",
      "import-style": "1.0.0"
    },
   ...
```
需要执行`spm install`。

前端的主要逻辑在`js/todos.js`里面，代码如下：
```javascript
/**
 * todos
 *
 * todos的前端代码
 * 只提交todo的操作，服务端维护todo状态
 */

var $ = require('jquery');
var NProgress = require('nprogress-183');
require('jquery-pjax-183');

/**
 * 初始化Pjax
 *
 * @return void
 */
function initPjax() {
    $(document).pjax('a', '#pjax-container');

    $(document).on('pjax:start', function() {
        NProgress.start();
    });

    $(document).on('pjax:end', function() {
        NProgress.done();
    });
}

var ENTER_KEY = 13; //回车键
var ESCAPE_KEY = 27; //esc键

var $newTodoInput = $("#new-todo"), //新建一个todo
    $listLi = $("#todo-list li"), //列表单元
    $listToggle = $("#todo-list .toggle"), //切换todo状态
    $listLiEdit = $("#todo-list .edit"), //编辑输入
    $toggleall = $("#toggle-all"), //切换所有的todo状态
    $listDestroy = $("#todo-list .destroy"), //删除todo
    $clearCompleted = $("#clear-completed"); //清除完成的


/**
 * 界面操作对象
 * @type {Object}
 */
var actions = {
    toggleAll: {
        url: '/todos/toggleall',
        method: 'PUT',
        eventHandle: [{
            event: 'click',
            elem: $toggleall
        }]
    },
    add: {
        url: '/todo',
        method: 'POST',
        eventHandle: [{
            event: 'keyup',
            elem: $newTodoInput,
            handle: function(e) {
                if (e.which === ENTER_KEY) {
                    actions.add.data = {
                        todo: $(e.target).val() + ''
                    };
                    $(e.target).val('');
                    return true;
                }
            }
        }]
    },
    edit: {
        url: '/todo/',
        method: 'PUT',
        before: function(elem) {
            this.params = elem.parents('li').attr('data-id');

            var state = elem.parents('li').find('.toggle').attr('checked') ? 1 : 0;

            this.data = {
                todo: elem.parents('li').find('label').text(),
                state: state
            };
        },
        eventHandle: [{
            event: 'click',
            elem: $listToggle
        }, {
            event: 'dblclick',
            elem: $listLi,
            handle: function(e) {
                var $input = $(e.target).closest('li').addClass('editing').find('.edit');
                $input.val($input.val()).focus();
                return false;
            }
        }, {
            event: 'keyup',
            elem: $listLiEdit,
            handle: function(e) {
                var val = e.target.value;
                if (e.which === ENTER_KEY) {
                    $(e.target).blur();

                    $(e.target).parents('li').find('label').text(val);
                    return true;
                }

                if (e.which === ESCAPE_KEY) {
                    $(e.target).blur();
                }

                return false;
            }

        }, {
            event: 'blur',
            elem: $listLiEdit,
            handle: function(e) {
                $(e.target).parents('li').removeClass('editing');
            }
        }]
    },
    remove: {
        url: '/todo/',
        method: 'DELETE',
        before: function(elem) {
            this.params = elem.parents('li').attr('data-id');
        },
        eventHandle: [{
            event: 'click',
            elem: $listDestroy,
            handle: function() {
                return true;
            }
        }]
    },
    clearCompleted: {
        url: '/todos/completed',
        method: 'DELETE',
        eventHandle: [{
            event: 'click',
            elem: $clearCompleted
        }]
    }
}

/**
 * 事件绑定操作
 * @return {void}
 */
function bind() {
    $.each(actions, function(key, value) {
        $.each(value.eventHandle, function(index, hb) {
            hb.elem.live(hb.event, function(e) {
                var isSend = false;
                if (hb.handle) {
                    isSend = hb.handle(e);
                } else {
                    isSend = true;
                }
                if (isSend) {
                    if (value.before) {
                        value.before($(e.target));
                    }
                    send(value);
                }
            });
        });
    });
    initPjax();
}

/**
 * 发送操作信息
 * @param  {Object} hb
 * @return {void}
 */
function send(hb) {
    var url = hb.url + (hb.params || '');
    $.ajax({
        url: url,
        type: hb.method,
        data: hb.data ? hb.data : null,
        dataType: "json"
    }).done(function(data) {
        if (data.opts) {
            $.pjax.reload('#pjax-container');
        } else {
            alert('something wrong!');
        }
    }).fail(function() {
        alert('something wrong!');
    });
}


bind();
```