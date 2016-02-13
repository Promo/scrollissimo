const gulp = require('gulp'),
	babel = require('gulp-babel'),
	insert = require('gulp-insert'),
	rename = require('gulp-rename'),
	packageInfo = require('./package.json'),
	SCROLLISSIMO_BADGE = `/**
 * Scrollissimo
 * Javascript plugin for smooth scroll-controlled animations
 * @version ${packageInfo.version}
 * @author frux <qdinov@yandex.ru>
 * @url https:// github.com/Promo/scrollissimo
 */\n`;

gulp.task('es5', function(){
	gulp.src('./scrollissimo.js')
	.pipe(babel({
		presets: ['es2015'],
		compact: true,
		comments: false,
		plugins: ['transform-es2015-modules-umd']
	}))
	.pipe(insert.prepend(SCROLLISSIMO_BADGE))
	.pipe(rename({
		extname: '.es5.js'
	}))
	.pipe(gulp.dest('./'));
});
