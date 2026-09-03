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

  // Phone brands for the device picker on the invoice form.
  phoneBrands: [
    'Samsung',
    'Apple (iPhone)',
    'Oppo',
    'Huawei',
    'Xiaomi',
    'Vivo',
    'Tecno',
    'Infinix',
    'Nokia',
    'OnePlus',
    'Realme',
    'Google Pixel',
    'Other',
  ],

  // Laptop/computer brands for the device picker on the invoice form.
  laptopBrands: [
    'Dell',
    'HP',
    'Lenovo',
    'Asus',
    'Acer',
    'Apple (MacBook)',
    'Toshiba',
    'Microsoft Surface',
    'Other',
  ],

  // Quick-add buttons in the invoice line-item form, grouped by category.
  serviceGroups: [
    {
      label: 'Phone & laptop repairs',
      services: [
        { description: 'LCD / screen replacement', rate: 0 },
        { description: 'Battery replacement', rate: 0 },
        { description: 'Password / PIN removal', rate: 0 },
        { description: 'PayJoy removal', rate: 0 },
        { description: 'FoneYami removal', rate: 0 },
        { description: 'Laptop repair / diagnostics', rate: 0 },
        { description: 'Computer repair / diagnostics', rate: 0 },
        { description: 'Data security & backup', rate: 0 },
        { description: 'Networking & IT support', rate: 0 },
      ],
    },
    {
      label: 'Websites & design',
      services: [
        { description: 'Website design & build', rate: 0 },
        { description: 'Website hosting & domain setup', rate: 0 },
        { description: 'Website maintenance / updates', rate: 0 },
        { description: 'E-commerce store setup', rate: 0 },
        { description: 'Logo design', rate: 0 },
        { description: 'Business card design', rate: 0 },
        { description: 'SEO / Google Business setup', rate: 0 },
        { description: 'Social media page setup', rate: 0 },
      ],
    },
  ],
}
