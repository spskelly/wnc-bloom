// preset arrangements. each plant is [speciesId, u, v, sizeMultiplier, narrowU, narrowV]:
// u is 0..1 across the scene, v is 0..1 from the horizon (back) to the front edge.
// narrow overrides let the phone layout stagger rows so plants don't pile up.
// extras: 'path' (driveway), 'bed' (mulch bed), 'window' (frame overlay)
export const arrangements = [
  { id: 'everything', title: 'One of everything', about: 'The full list as single specimens. A reference, not a design.',
    plants: [
      ['saucer', .097, .133, 1, .167, .033], ['yoshino', .25, .133, 1, .5, .033], ['silverbell', .413, .133, 1, .833, .033],
      ['kwanzan', .577, .133, 1, .238, .273], ['redbud', .74, .133, 1, .56, .273], ['serviceberry', .908, .133, 1, .857, .273],
      ['star', .179, .547, 1, .131, .5], ['dogwoodw', .347, .547, 1, .381, .5], ['dogwoodp', .653, .547, 1, .643, .5], ['sweetbay', .832, .547, 1, .893, .5],
      ['forsythia', .071, .947, 1, .119, .74], ['loropetalum', .204, .947, 1, .357, .74], ['piedmont', .337, .947, 1, .595, .74], ['catawba', .48, .947, 1, .857, .74],
      ['laurel', .617, .947, 1, .19, .983], ['flame', .755, .947, 1, .5, .983], ['spicebush', .898, .947, 1, .81, .983],
    ] },
  { id: 'woodland', title: 'Woodland edge', about: 'A serviceberry and redbud drift along the tree line, dogwoods inside the shade, native azaleas in fives, laurel and rhododendron as the evergreen understory.',
    plants: [
      ['whitepine', .05, 0, 1], ['hemlock', .17, 0, .9], ['whitepine', .29, 0, 1.05], ['hemlock', .41, 0, .95], ['whitepine', .53, 0, 1], ['hemlock', .66, 0, .9], ['whitepine', .79, 0, 1.05], ['hemlock', .92, 0, .95],
      ['serviceberry', .1, .2, 1, .1, .16], ['redbud', .28, .2, 1, .3, .18], ['serviceberry', .46, .2, 1, .5, .16], ['redbud', .64, .2, 1, .7, .18], ['serviceberry', .82, .2, 1, .9, .16],
      ['dogwoodw', .22, .5, 1, .24, .44], ['dogwoodp', .64, .5, 1, .72, .44],
      ['piedmont', .07, .72, 1, .1, .66], ['piedmont', .16, .74, 1, .24, .68], ['piedmont', .25, .72, 1, .38, .66],
      ['flame', .56, .72, 1, .62, .66], ['flame', .65, .74, 1, .76, .68], ['flame', .74, .72, 1, .9, .66],
      ['bluebell', .38, .8, 1, .5, .78], ['daffodil', .88, .84, 1, .12, .82],
      ['laurel', .04, .95, 1, .08, .92], ['catawba', .4, .95, 1.1, .32, .96], ['laurel', .52, .97, 1, .58, .92], ['catawba', .9, .95, 1.1, .86, .96],
    ] },
  { id: 'driveway', title: 'Two-peak driveway', about: 'Yoshino and Kwanzan alternated down an entry, so the pink corridor lasts three weeks instead of ten days. Loropetalum carries the line the rest of the year.',
    extras: ['path'],
    plants: [
      ['yoshino', .3, .12, .65], ['kwanzan', .7, .12, .65],
      ['loropetalum', .28, .27, .6], ['loropetalum', .72, .27, .6],
      ['kwanzan', .21, .4, .8], ['yoshino', .79, .4, .8],
      ['loropetalum', .18, .56, .8], ['loropetalum', .82, .56, .8],
      ['yoshino', .11, .7, .95], ['kwanzan', .89, .7, .95],
      ['loropetalum', .08, .85, 1], ['loropetalum', .92, .85, 1],
      ['kwanzan', .03, .97, 1.1, .05, .97], ['yoshino', .97, .97, 1.1, .95, .97],
    ] },
  { id: 'window', title: 'Kitchen window triad', about: 'The one spot you look at every day: redbud, white dogwood, and Catawba rhododendron against a white pine, peaking early April, late April, and June.',
    extras: ['window'],
    plants: [
      ['whitepine', .4, .03, 1.35, .35, .02], ['hemlock', .6, .03, 1.2, .66, .02],
      ['redbud', .3, .45, 1.05, .28, .38], ['dogwoodw', .66, .5, 1.05, .72, .42],
      ['daffodil', .22, .9, 1.1, .16, .9], ['bluebell', .74, .9, 1.1, .84, .9],
      ['catawba', .48, .85, 1.3, .5, .82],
    ] },
  { id: 'magnolia', title: 'Magnolia relay', about: 'Star, then saucer, then sweetbay: one genus from mid March into June. Saucer goes on the cool north side so a late frost is less likely to brown it.',
    plants: [
      ['hemlock', .18, 0, 1.1], ['hemlock', .5, 0, 1.15], ['hemlock', .82, 0, 1.1],
      ['saucer', .52, .28, 1, .55, .2],
      ['star', .15, .55, 1, .18, .48], ['sweetbay', .82, .55, 1, .82, .52],
      ['daffodil', .4, .75, 1, .4, .7], ['bluebell', .68, .8, 1, .62, .72],
      ['star', .32, .9, 1, .3, .88], ['sweetbay', .62, .95, 1, .72, .95],
    ] },
  { id: 'hotbed', title: 'Hot bed', about: 'Forsythia, loropetalum, spicebush, and flame azalea in one bed against dark evergreens: yellow, magenta, chartreuse, orange from March to late May.',
    extras: ['bed'],
    plants: [
      ['hemlock', .15, 0, 1.1], ['whitepine', .5, 0, 1.2], ['hemlock', .85, 0, 1.1],
      ['forsythia', .1, .7, 1.2, .1, .62], ['loropetalum', .25, .9, 1, .3, .82], ['spicebush', .4, .7, 1, .5, .62],
      ['flame', .55, .9, 1.15, .7, .82], ['forsythia', .7, .7, 1.1, .9, .62], ['loropetalum', .85, .9, 1, .5, .98], ['daffodil', .93, .72, 1, .12, .95],
    ] },
];
