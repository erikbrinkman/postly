'use strict';

var gulp = require('gulp');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');

gulp.task('default', ['serve'], function() {
    return gulp.src("")
    .pipe(notify({ message: 'Serving' }));
});

gulp.task('serve', function() {
    browserSync({
        server: {
            notify: false,
            baseDir: "./"
        }
    });

    gulp.watch(['**/*.html', '**/*.css', '**/*.less', '**/*.js'], browserSync.reload);
});
