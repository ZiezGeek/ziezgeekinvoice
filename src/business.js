// Business details shown on the invoice header/footer.
// Bank details are intentionally blank — fill in when ready.
export const BUSINESS = {
  name: 'ZiezGeek Aldevinc',
  tagline: 'Smart Tech Solutions',
  phone: '071 954 9523',
  email: 'nkosinathi@ziezgeekaldev.store',
  address: '3788 Afghan, Kinross Ext 25, 2270',
  bank: {
    accountName: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
  },
  // Quick-add buttons in the invoice line-item form.
  commonServices: [
    { description: 'LCD / screen replacement', rate: 0 },
    { description: 'Battery replacement', rate: 0 },
    { description: 'Password / PIN removal', rate: 0 },
    { description: 'PayJoy removal', rate: 0 },
    { description: 'FoneYami removal', rate: 0 },
    { description: 'Laptop repair / diagnostics', rate: 0 },
    { description: 'Computer repair / diagnostics', rate: 0 },
    { description: 'Website design & build', rate: 0 },
    { description: 'Business card design', rate: 0 },
  ],
}
