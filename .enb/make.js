var techs = {
        // essential
        fileProvider : require('enb/techs/file-provider'),
        fileMerge : require('enb/techs/file-merge'),

        // optimization
        borschik : require('enb-borschik/techs/borschik'),

        // css
        stylus : require('enb-stylus/techs/stylus'),

        // js
        browserJs : require('enb-diverse-js/techs/browser-js'),
        prependYm : require('enb-modules/techs/prepend-modules'),

        // bemhtml
        bemhtml : require('enb-bemxjst/techs/bemhtml'),
        bemjsonToHtml : require('enb-bemxjst/techs/bemjson-to-html')
    },
    enbBemTechs = require('enb-bem-techs'),
    levels = [
        { path : 'libs/bem-core/common.blocks', check : false },
        { path : 'libs/bem-core/desktop.blocks', check : false },
        { path : 'libs/bem-components/common.blocks', check : false },
        { path : 'libs/bem-components/desktop.blocks', check : false },
        { path : 'libs/bem-components/design/common.blocks', check : false },
        { path : 'libs/bem-components/design/desktop.blocks', check : false },
        'design/common.blocks',
        'common.blocks',
        'desktop.blocks',
        'promo.blocks'
    ];

module.exports = function(config) {
    var isProd = process.env.YENV === 'production';

    config.nodes('*.bundles/*', function(nodeConfig) {
        nodeConfig.addTechs([
            // essential
            [enbBemTechs.levels, { levels : levels }],
            [techs.fileProvider, { target : '?.bemjson.js' }],
            [enbBemTechs.bemjsonToBemdecl],
            [enbBemTechs.deps],
            [enbBemTechs.files],

            // css
            [techs.stylus, {
                autoprefixer : {
                    browser : ['last 2 versions', 'ie >= 10', 'opera 12.1']
                }
             }],

            // bemtree
            // [techs.bemtree, { devMode: process.env.BEMTREE_ENV === 'development' }],

            // bemhtml
            [techs.bemhtml, { devMode : process.env.BEMHTML_ENV === 'development' }],
            [techs.bemjsonToHtml],

            // client bemhtml
            [enbBemTechs.depsByTechToBemdecl, {
                target : '?.bemhtml.bemdecl.js',
                sourceTech : 'js',
                destTech : 'bemhtml'
            }],
            [enbBemTechs.deps, {
                target : '?.bemhtml.deps.js',
                bemdeclFile : '?.bemhtml.bemdecl.js'
            }],
            [enbBemTechs.files, {
                depsFile : '?.bemhtml.deps.js',
                filesTarget : '?.bemhtml.files',
                dirsTarget : '?.bemhtml.dirs'
            }],
            [techs.bemhtml, {
                target : '?.browser.bemhtml.js',
                filesTarget : '?.bemhtml.files',
                devMode : process.env.BEMHTML_ENV === 'development'
            }],

            // js
            [techs.browserJs],
            [techs.fileMerge, {
                target : '?.pre.js',
                sources : ['?.browser.bemhtml.js', '?.browser.js']
            }],
            [techs.prependYm, { source : '?.pre.js' }],

            // borschik
            [techs.borschik, { sourceTarget : '?.js', destTarget : '_?.js', freeze : true, minify : isProd }],
            [techs.borschik, { sourceTarget : '?.css', destTarget : '_?.css', tech : 'cleancss', freeze : true, minify : isProd }]
        ]);

        nodeConfig.addTargets(['?.html', '_?.css', '_?.js']);
    });

    // tmpl specs
    config.includeConfig('enb-bem-tmpl-specs');

    configureSets(['desktop'], {
        tmplSpecs : config.module('enb-bem-tmpl-specs').createConfigurator('tmpl-specs')
    });

    function configureSets(platforms, sets) {
        platforms.forEach(function(platform) {
            sets.tmplSpecs.configure({
                destPath : platform + '.tmpl-specs',
                levels : ['common.blocks', 'design/common.blocks', platform + '.blocks'],
                sourceLevels : levels,
                engines : {
                    bh : {
                        tech : 'enb-bh/techs/bh-server',
                        options : {
                            jsAttrName : 'data-bem',
                            jsAttrScheme : 'json'
                        }
                    },
                    'bemhtml-dev' : {
                        tech : 'enb-bemxjst/techs/bemhtml',
                        options : {
                            exportName : 'BEMHTML',
                            devMode : true
                        }
                    },
                    'bemhtml-prod' : {
                        tech : 'enb-bemxjst/techs/bemhtml',
                        options : {
                            exportName : 'BEMHTML',
                            devMode : false
                        }
                    }
                }
            });
        });
    }
};
