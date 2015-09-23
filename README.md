# todos

这个项目主要用于yo的使用和教学。

将会建立多个分支阐述创建一个todo list的过程。

第二步：

### 编写服务接口配置
需要存储todo list的服务，这个例子数据和状态主要保存服务端，

* 添加一个todo;
* 编辑一个todo;
* 获取todo列表；
* 切换todo的状态；
* 删除todo；
* 清除已完成的todo；

代码如下：

server/stub/router.js

``` javascript
var list = [];
var toggleAll = false;
module.exports = function(app) {

    //添加
    app.post('/todo', function(req, res) {
        if (req.body.todo) {
            list.push({
                id: uuid(),
                todo: req.body.todo,
                state: 0
            });
            res.send(ret(true));
        } else {
            res.send(ret(false));
        }
    });

    //编辑保存
    app.put('/todo/:id', function(req, res) {
        var saved = false,
            state;
        if (req.params.id) {
            for (var i = 0; i < list.length; i++) {
                if (req.params.id === list[i].id) {
                    setval(req.body.todo, req.body.state, list[i]);
                    saved = true;
                }
            }
        }
        res.send(ret(saved));
    });

    //首页
    app.get('/todos', function(req, res) {
        var data = ret(true, list);
        res.send(data);
    });

    //删除
    app.delete('/todo/:id', function(req, res) {
        var isDel = false;
        if (req.params.id) {
            for (var i = 0; i < list.length; i++) {
                if (req.params.id === list[i].id) {
                    list.splice(i, 1);
                    isDel = true;
                    break;
                }
            }
        }
        res.send(ret(isDel));
    });

    //切换状态
    app.put('/todos/toggleall', function(req, res) {
        for (var i = 0; i < list.length; i++) {
            if (!toggleAll) {
                list[i].state = 1;
            } else {
                list[i].state = 0;
            }
        }
        toggleAll = !toggleAll;
        res.send(ret(true));
    });

    //清除完成项
    app.delete('/todos/completed', function(req, res) {
        var unCompleted = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].state === 0) {
                unCompleted.push(list[i]);
            }
        }
        list = unCompleted;
        return res.send(ret(true, list));
    });
}

...

```
可以用postman类似的http客户端测试下服务：

![postman](http://7wy47w.com1.z0.glb.clouddn.com/C031899C-515A-455E-9013-D5126B1ABDAE.png)