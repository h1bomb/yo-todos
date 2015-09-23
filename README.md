# todos

这个项目主要用于yo的使用和教学。

将会建立多个分支阐述创建一个todo list的过程。

第三步：

### 编写前端view对应后端服务的接口配置和接口适配

```javascript
exports.domain = 'http://localhost:3000';
exports.res =
    [{
    route: '/',
    method: 'GET',
    view: 'pages/index',
    url: '/todos/',
    params: []
}, {
    route: '/:state',
    method: 'GET',
    view: 'pages/index',
    url: '/todos/',
    adapter: 'index',
    params: []
}];
```
目前的todo的view只有一个，为了使不同状态的匹配加了"/:state"的路由。
后端映射到同一个接口。

后端服务也许无法满足你前端展示的要求，所以，会在适配层，加一些返回数据结构的处理。
适配层的业务注入规约：会找到interface的路由作为注入的原则（路由名称+请求方法），或者指定路由的适配的业务模块。
代码如下（server/adapters/index.js）
```javascript
exports.get = function(data, req, res) {
    var states = ['active', 'completed'];
    var curState = 'all';
    var curStateVal = 3;
    data.completedTodos = false; //完成的todos
    data.activeTodoWord = 'items';//todo单位的单复数
    data.activeTodoCount = 0;//当前未完成todo
    data.allCount = data.data.length;//所有的todo数量
    data.module = 'todos';//js的入口模块
    var curData = [];

    for (var j = 0; j < states.length; j++) { //判断过滤条件
        if (states[j] === req.proxyParams.params.state) {
            curState = states[j];
            curStateVal = j;
            break;
        } else {
            curState = 'all';
            curStateVal = 3;
        }
    }

    data[curState] = true; //设置当前的过滤条件

    for (var i = 0; i < data.data.length; i++) {
        if (data.data[i].state === 1) { //设置是否有完成
            data.completedTodos = true;
            data.data[i].completed = true;
        } else {
            data.activeTodoCount++; //设置todo的数据
        }

        if (data.data[i].state === curStateVal) {
            curData.push(data.data[i]); //过滤数据
        }
    }

    if (curStateVal !== 3) { //设置过滤后的数据
        data.data = curData;
    }

    if (data.activeTodoCount === 1) { //设置展示单复数
        data.activeTodoWord = 'item';
    }
    return data;
}

```