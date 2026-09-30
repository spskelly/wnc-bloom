// region config: everything that is specific to western north carolina lives here.
// a second region is a second file with the same shape plus its own species windows.
export const region = {
  id: 'wnc',
  name: 'Western North Carolina',
  // day 0 of the season. bloom windows in species.js are day offsets from this date
  seasonStart: { month: 3, day: 1 },
  totalDays: 121, // march 1 through june 30
  monthTicks: [
    { day: 0, label: 'March' }, { day: 31, label: 'April' }, { day: 61, label: 'May' }, { day: 92, label: 'June' }, { day: 121, label: 'Jun 30' },
  ],
  // the elevation the species windows were written for, and how fast bloom lags with height.
  // seven days per thousand feet is the usual rule of thumb for the southern appalachians
  elevation: { baselineFt: 2500, daysPer1000Ft: 7, minFt: 1500, maxFt: 6000, defaultFt: 2800, stepFt: 100 },
  footnote: 'Windows are typical for 2,000 to 3,000 ft around Waynesville. The elevation slider shifts every window by about a week per 1,000 ft; a warm March pulls everything forward. Deciduous plants show as bare branches until their leaves come in.',
};
