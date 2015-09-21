/**
 * gulp file 执行compass解析，spm build以及文件合并压缩等
 * author： xuqi(qi.xu@yoho.cn)
 * date； 2015/3/27
 */
var gulp = require('gulp'),
    fs = require('fs'),
    ftp = require('gulp-ftp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    compass = require('gulp-compass'),
    exec = require('child_process').exec,
    server = require('gulp-develop-server'),
    mkdirp = require('mkdirp'),
    uglify = require('gulp-uglify'),
    Package = require('father').SpmPackage,
    transport = require('gulp-spm'),
    md5 = require("gulp-md5"),
    request = require('request'),
    rmdir = require('rmdir');

var config = JSON.parse(fs.readFileSync('./package.json').toString());
var assets_dir = 'dist/' + config.name + '/assets';
var public_dir = '../public';
var server_dir = '../server';
var dist_dir = {
    js: 'dist/' + config.name + '/' + config.version,
    css: 'dist/' + config.name + '/' + config.version,
    image: assets_dir + '/images',
    font: assets_dir + '/fonts'
};

var cdn_domain = 'http://cdn.yoho.cn/';

var ftpConfig = {
    host: '218.94.75.58',
    user: 'php',
    pass: 'yoho9646'
};

// 本地运行时
// 启动
gulp.task('start', ['server', 'server:restart', 'compass-watch', 'compass']);

gulp.task('default', ['compass', 'compass-production', 'build']);

// start express server
gulp.task('server', function() {
    server.listen({
        path: server_dir + '/app.js'
    });
});

// restart server if app.js changed
gulp.task('server:restart', function() {
    gulp.watch([
        server_dir + '/app.js', server_dir + '/views/**/*.html', server_dir + '/views/controller/*.js',
        server_dir + '/views/*.html', public_dir + '/css/*.css', public_dir + '/js/data.js'
    ], server.restart);
});

//compass 解析压缩合并
gulp.task('compass-watch', function() {
    gulp.watch('sass/**/*.scss', ['compass']);
});

//样式表的预编译
gulp.task('compass', function() {
    gulp.src('sass/**/*.scss')
        .pipe(
            compass({
                config_file: 'config.rb',
                css: public_dir + '/css',
                sass: 'sass'
            })
        )
});



//发布到CDN
gulp.task('dist', function() {
    var ftpstream = ftp(ftpConfig);
    return gulp.src('dist/**/')
        .pipe(ftpstream)
        .pipe(gutil.noop());
});

//STEP1:拷贝fonts+images到发布目录
gulp.task('assets', function() {
    gulp.src(public_dir + '/img/**')
        .pipe(gulp.dest(dist_dir.image));
    gulp.src(public_dir + '/fonts/*')
        .pipe(gulp.dest(dist_dir.font));
});

//STEP2:compass整合所有css到index后发布到发布目录
gulp.task('compass-production', ['assets', 'libs-build'], function() {
    gulp.src('sass/index.scss')
        .pipe(
            compass({
                css: dist_dir.css,
                sass: 'sass',
                image: dist_dir.image,
                font: dist_dir.font,
                http_path: '/',
                style: 'compressed'
            })
        )
        .on('error', function(error) {
            console.log(error);
            this.emit('end');
        });
});

//spm build
gulp.task('build', ['libs-build', 'index-build', 'config-libs', 'compass-production'], function() {
    gulp.src(dist_dir.js + '/**')
        .pipe(gulp.dest(public_dir + '/dist'));
});

gulp.task('index-build', ['libs-build'], function() {
    var pkg = new Package(__dirname);
    return gulp.src(pkg.main)
        .pipe(transport({
            pkg: pkg
        }))
        .pipe(concat('index-debug.js'))
        .pipe(gulp.dest(dist_dir.js))
        .pipe(uglify())
        .pipe(concat('index.js'))
        .pipe(gulp.dest(dist_dir.js));
});

//SPM 打包库文件
gulp.task('pre-libs', function() {
    libPkgPre();
    var pkg = new Package(__dirname);
    return gulp.src(pkg.main)
        .pipe(transport({
            pkg: pkg
        }))
        .pipe(gulp.dest(dist_dir.js));
});

//清除过程文件
gulp.task('clear-libs', ['concat-libs', 'min-libs'], function() {
    fs.renameSync('package_bak.json', 'package.json'); //恢复原包配置文件
    fs.unlinkSync('./libs.js'); //删除入口文件
    fs.unlinkSync(dist_dir.js + '/libs.js');
});

//合并库文件
gulp.task('concat-libs', ['pre-libs'], function() {
    delLibsMainModule();
    return gulp.src([public_dir + '/sea.js', dist_dir.js + '/libs.js'])
        .pipe(concat('libs-all.js'))
        .pipe(gulp.dest(dist_dir.js));
});

//压缩库文件
gulp.task('min-libs', ['pre-libs'], function() {
    return gulp.src([public_dir + '/sea.js', dist_dir.js + '/libs.js'])
        .pipe(concat('deps.js'))
        .pipe(uglify())
        .pipe(md5())
        .pipe(gulp.dest('./dist/libs'));

});

//配置静态文件目录
gulp.task('config-libs', ['libs-build'], function() {
    var files = fs.readdirSync('./dist/libs'),
        preStr = 'exports.staticDir = ',
        i, data, depsFile;
    for (i = 0; i < files.length; i++) {
        if (files[i].indexOf('deps_') > -1) {
            data = {
                test: {
                    libs: '/dist/libs-all.js',
                    js: '/dist/index-debug.js'
                },
                production: {
                    libs: cdn_domain + 'libs/' + files[i],
                    js: cdn_domain + config.name + '/' + config.version + '/index.js',
                    css: cdn_domain + config.name + '/' + config.version + '/index.css'
                }
            };
            depsFile = files[i];
            //写入静态文件配置
            fs.writeFileSync('../server/staticConfig.js', preStr + JSON.stringify(data));
        }
    }

    request(cdn_domain + 'libs/' + depsFile, function(error, response, body) {
        if (response.statusCode == 200) {
            rmdir('./dist/libs', function() {});
        }
    })
});

//库文件执行
gulp.task('libs-build', ['pre-libs', 'concat-libs', 'min-libs', 'clear-libs']);

//库文件的入口文件和过程文件的生成
function libPkgPre() {
    var obj = {
            name: '',
            version: config.version,
            spm: config.spm
        },
        libCon, libsjs = '',
        key,
        libDir = dist_dir.js + '';
    obj.spm.main = 'libs.js';
    obj.spm.buildArgs = '--idleading {{name}} --include all';

    libCon = JSON.stringify(obj);
    fs.renameSync('package.json', 'package_bak.json');
    fs.writeFileSync('package.json', libCon); //生成库文件pkg配置
    var packages = [];
    for (key in obj.spm.dependencies) {
        if (obj.spm.inside && obj.spm.inside[key]) {
            packages.push(obj.spm.inside[key]);
        } else {
            packages.push(key);
        }
    }
    for (var i = 0; i < packages.length; i++) {
        libsjs += "require('" + packages[i] + "');";
    }


    fs.writeFileSync('libs.js', libsjs); //写入口文件
    return libDir;
}

//删除库模块的入口模块
function delLibsMainModule() {
    var path = dist_dir.js + '/libs.js';
    var jsStr = fs.readFileSync(path).toString();
    var position = jsStr.indexOf('});');
    jsStr = jsStr.substr(position + 4);
    fs.writeFileSync(path, jsStr);
}