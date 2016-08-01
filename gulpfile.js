const gulpjs = require('gulp');
const jshint = require('gulp-jshint');
const concat = require('gulp-concat');
//const minify = require('gulp-minify');
//const uglify = require('gulp-uglify');
const srcmap = require('gulp-sourcemaps');

gulpjs.task('default', () => {
  gulpjs.src([
    'MoNoApps.Main.js',
    'MoNoApps.*.lib.js',
    'MoNoApps.Module.js'
  ])
    .pipe(jshint({ esversion: 6 }))
    .pipe(jshint.reporter('default'))
    .pipe(srcmap.init())
    .pipe(concat('monoapps.js'))
    //.pipe(minify())
    //.pipe(uglify())
    .pipe(srcmap.write())
    .pipe(gulpjs.dest('./build/'));
});