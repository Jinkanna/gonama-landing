/* ==========================================================================
   GOnama · globo del hero

   Canvas 2D a medida, sin dependencias. Se eligio sobre Three.js porque para
   un solo elemento la libreria pesa mas que toda la landing, y el requisito
   es Lighthouse por encima de 95.

   Los continentes son puntos reales muestreados de Natural Earth 110m,
   precalculados y empaquetados en base 36: 2488 posiciones en unos 14 KB.
   ========================================================================== */

(function () {
  'use strict';

  if (window.__gnGlobeReady) return;
  window.__gnGlobeReady = true;

  var LAND = 'cb9e,cba5,d6df,d6e5,e4f7,e4fe,e615,f039,f03f,f045,fb81,fb87,fd60,fd66,106c9,106ce,1087a,108ae,11205,1120b,11211,11216,113bf,113f1,113f7,1201f,12024,1202a,1202f,1220c,12b62,12b67,12b6c,12b72,12b77,12b7c,12d0c,12d12,12d17,12d1c,12d51,136a5,136aa,136b0,136b5,136ba,136bf,13821,1384f,13854,13859,1385e,13863,141ee,141f3,141f8,141fd,14202,14207,1420c,142a2,142a7,142ac,142b1,14365,1436a,1436f,14388,1438d,14392,14397,1439c,143a1,143a6,14d32,14d37,14d3c,14d41,14d46,14d4a,14d4f,14d54,14de2,14de7,14dec,14df1,14df6,14dfb,14ea6,14eab,14eaf,14eb4,14eb9,14ebe,14ec3,14ec8,14ecd,14ed2,14ed7,14edb,14ee0,14ee5,14eea,14eef,15b47,15b4c,15b51,15b56,15b5a,15b5f,15b64,15b69,15b6e,15bf8,15bfd,15c02,15c07,15c0c,15c10,15cbd,15cc2,15cc6,15ccb,15cd0,15cd5,15cd9,15cde,15ce3,15ce8,15ced,15cf1,15cf6,15cfb,15d00,15d05,1668c,16690,16695,1669a,1669f,166a3,166a8,166ad,166b1,1673a,1673e,16743,16748,1674c,16751,16756,167fa,167ff,16804,16808,1680d,16812,16816,1681b,16820,16824,16829,1682e,16833,16837,1683c,16841,16845,171d1,171d5,171da,171de,171e3,171e8,171ec,171f1,171f5,171fa,1727b,17280,17285,17289,1728e,17292,17297,1729c,172a0,172b3,172b7,17342,17346,1734b,17350,17354,17359,1735d,17362,17367,1736b,17370,17375,17379,1737e,17382,17387,17d16,17d1a,17d1f,17d23,17d28,17d2c,17d31,17d35,17d3a,17d3e,17d43,17d48,17dbe,17dc2,17dc7,17dcb,17dd0,17dd4,17dd9,17ddd,17de2,17df9,17dfd,17e86,17e8a,17e8f,17e93,17e98,17e9c,17ea1,17ea5,17eaa,17eae,17eb3,17eb8,17ebc,17ec1,17ec5,17eca,1885b,1885f,18864,18868,1886d,18871,18876,1887a,1887f,18883,18888,1888c,18891,18901,18905,1890a,1890e,18913,18917,1891b,18920,18924,1893f,18944,189d3,189d8,189dc,189e1,189e5,189e9,189ee,189f2,189f7,189fb,18a00,18a04,18a09,1966d,19671,19676,1967a,1967f,19683,19688,1968c,19690,19695,19699,1969e,196a2,196a7,19711,19715,19719,1971e,19722,19727,1972b,19730,19734,19738,1973d,19741,19753,19757,197ee,197f2,197f7,197fb,197ff,19804,19808,1980d,19811,19815,1981a,1985c,1a0d4,1a1aa,1a1af,1a1b3,1a1b7,1a1bc,1a1c0,1a1c4,1a1c9,1a1cd,1a1d2,1a1d6,1a1da,1a1df,1a1e3,1a1e7,1a1ec,1a255,1a259,1a25d,1a262,1a266,1a26b,1a26f,1a273,1a278,1a27c,1a280,1a285,1a289,1a29b,1a29f,1a338,1a33c,1a341,1a345,1a349,1a34e,1a35b,1ace8,1acec,1acf0,1acf5,1acf9,1acfd,1ad02,1ad06,1ad0a,1ad0f,1ad13,1ad17,1ad1c,1ad20,1ad24,1ad29,1ad2d,1ad31,1ad99,1ad9e,1ada2,1ada6,1adab,1adaf,1adb3,1adb8,1adbc,1adc0,1adc5,1adc9,1adcd,1ade3,1ae7f,1ae87,1ae8c,1ae9d,1b82a,1b82e,1b833,1b837,1b83b,1b83f,1b844,1b848,1b84c,1b851,1b855,1b859,1b85e,1b862,1b866,1b86a,1b86f,1b873,1b877,1b8e3,1b8e7,1b8eb,1b8ef,1b8f4,1b8f8,1b8fc,1b901,1b905,1b909,1b90e,1b912,1b9cf,1c36d,1c371,1c375,1c379,1c37e,1c382,1c386,1c38a,1c38f,1c393,1c397,1c39b,1c3a0,1c3a4,1c3a8,1c3ad,1c3b1,1c3b5,1c3b9,1c3be,1c424,1c428,1c42c,1c431,1c435,1c439,1c43d,1c442,1c446,1c44a,1c44e,1c453,1c457,1c4f9,1c530,1d180,1d185,1d189,1d18d,1d191,1d196,1d19a,1d19e,1d1a2,1d1a7,1d1ab,1d1af,1d1b3,1d1b8,1d1bc,1d1c0,1d1c4,1d1c8,1d1cd,1d1d1,1d1d5,1d23b,1d23f,1d243,1d248,1d24c,1d250,1d254,1d259,1d25d,1d261,1d265,1d26a,1d2f5,1d2fa,1d2fe,1d335,1d339,1d33d,1d342,1d35b,1dcbf,1dcc4,1dcc8,1dccc,1dcd0,1dcd4,1dcd9,1dcdd,1dce1,1dce5,1dcea,1dcee,1dcf2,1dcf6,1dcfa,1dcff,1dd03,1dd07,1dd0b,1dd10,1dd14,1dd18,1dd7d,1dd81,1dd86,1dd8a,1dd8e,1dd92,1dd97,1dd9b,1dd9f,1dda3,1dda7,1ddac,1de33,1de76,1de7a,1de7f,1de83,1de8b,1de90,1e807,1e80b,1e80f,1e814,1e818,1e81c,1e820,1e824,1e829,1e82d,1e831,1e835,1e839,1e83e,1e842,1e846,1e84a,1e84f,1e853,1e857,1e8bc,1e8c0,1e8c4,1e8c9,1e8cd,1e8d1,1e8d5,1e8d9,1e8de,1e8e2,1e8e6,1e8ea,1e8ee,1e8f3,1e975,1e98a,1e9a3,1e9b0,1e9b4,1e9b8,1e9bd,1e9c1,1e9d6,1f34b,1f34f,1f353,1f357,1f35b,1f360,1f364,1f368,1f36c,1f370,1f375,1f379,1f37d,1f381,1f385,1f38a,1f38e,1f3fb,1f3ff,1f404,1f408,1f40c,1f410,1f414,1f419,1f41d,1f421,1f425,1f429,1f42e,1f432,1f436,1f43a,1f4b4,1f4b8,1f4c5,1f4c9,1f4cd,1f4d1,1f4da,1f4f3,1fe8f,1fe93,1fe97,1fe9b,1fe9f,1fea4,1fea8,1feac,1feb0,1feb4,1feb9,1febd,1fec1,1fec5,1ff43,1ff47,1ff4c,1ff50,1ff54,1ff58,1ff5c,1ff61,1ff65,1ff69,1ff6d,1ff71,1ff76,1ff7a,1ff7e,1ff82,1fff4,1fff8,20009,2000d,20011,20015,2001e,20022,20026,20ca8,20cac,20cb0,20cb5,20cb9,20cbd,20cc1,20cc5,20cca,20cce,20cd2,20cd6,20cdb,20d59,20d5d,20d61,20d65,20d69,20d6e,20d72,20d76,20d7a,20d7f,20d83,20d87,20d8b,20d8f,20d94,20d98,20d9c,20e05,20e09,20e0d,20e22,20e27,20e2b,217ed,217f1,217f5,217f9,217fd,21802,21806,2180a,2180e,21812,21817,2181b,21878,21891,21895,21899,2189e,218a2,218a6,218aa,218ae,218b3,218b7,218bb,218bf,218c4,218c8,218cc,218d0,218d4,218d9,218dd,218e1,218e5,21946,21953,2196c,21970,22331,22336,2233a,2233e,22342,22347,2234b,2234f,22353,223b5,223b9,223bd,223c1,223c5,223ca,223ce,223d2,223d6,223db,223df,223e3,223e7,223ec,223f0,223f4,223f8,223fc,22401,22405,22409,2240d,22412,22416,2241a,2241e,22423,22427,2242b,2246a,224c3,22e6e,22e72,22e76,22e7b,22e83,22e87,22e8c,22e90,22e94,22ef6,22efa,22eff,22f03,22f07,22f0b,22f10,22f14,22f18,22f1c,22f21,22f25,22f29,22f2d,22f32,22f36,22f3a,22f3e,22f43,22f47,22f4b,22f4f,22f54,22f58,22f5c,22f60,22f65,22f69,22f6d,22f71,22fa9,22fd3,22fe0,22ff9,239a6,239c0,239c9,23a34,23a38,23a3c,23a41,23a45,23a49,23a4d,23a52,23a56,23a5a,23a5e,23a63,23a67,23a6b,23a70,23a74,23a78,23a7c,23a81,23a85,23a89,23a8e,23a92,23a96,23a9a,23a9f,23aa3,23aa7,23ab4,23aec,23af0,23b23,23b28,247b9,247bd,24847,2484b,24850,24854,24858,2485d,24861,24865,2486a,2486e,24872,24876,2487b,2487f,24883,24888,2488c,24890,24895,24899,2489d,248a2,248a6,248aa,248af,248b3,248b7,248bc,248c0,24901,24905,24934,24939,2493d,24941,252f1,252f6,252fa,252fe,25303,2538a,2538e,25392,25397,2539b,253a0,253a4,253a8,253ad,253b1,253b5,253ba,253be,253c2,253c7,253cb,253cf,253d4,253d8,253dd,253e1,253e5,253ea,253ee,253f2,253f7,25404,25408,2540c,25411,25441,25445,25449,25471,25475,25479,2547e,25482,2549c,25e26,25e2a,25e2e,25e33,25e37,25e3c,25ed1,25ed6,25eda,25ede,25ee3,25ee7,25eec,25ef0,25ef5,25ef9,25efd,25f02,25f06,25f0b,25f0f,25f13,25f18,25f1c,25f21,25f25,25f29,25f2e,25f32,25f37,25f3b,25f44,25f48,25f4d,25f51,25f55,25f5a,25f81,25f86,25f8a,25f8f,25f93,25fad,25fb2,25fb6,25fbb,25fbf,25fc3,25fe2,268fc,26963,26967,2696b,26970,26982,269a1,269a5,26a15,26a19,26a1e,26a22,26a27,26a2b,26a30,26a34,26a39,26a3d,26a41,26a46,26a4a,26a4f,26a53,26a58,26a5c,26a61,26a65,26a6a,26a6e,26a73,26a77,26a7b,26a89,26a8d,26a92,26a96,26a9b,26a9f,26aa4,26ac7,26acc,26ad0,26ad5,26ad9,26ade,26aef,26af4,26af8,26afd,26b01,26b06,26b0f,274a4,274a9,274ad,274b2,274da,27559,2755e,27562,27567,2756b,27570,27574,27579,2757d,27582,27586,2758b,2758f,27594,27598,2759d,275a1,275a6,275aa,275af,275b3,275b8,275bc,275c5,275ca,275cf,275d3,275d8,275dc,275e1,275e5,275ea,27605,27609,2760e,27612,27617,2761b,27620,27624,27632,27636,2763b,27640,27644,27649,2764d,27652,27656,282b7,282bb,282c0,282c5,2836f,28373,28378,2837c,28381,28385,2838a,2838f,28393,28398,2839c,283a1,283a6,283aa,283af,283b3,283b8,283bd,283c1,283c6,283ca,283cf,283dd,283e1,283e6,283ea,283ef,283f4,283f8,283fd,28414,28418,2841d,28422,28426,2842b,2842f,28434,28438,2843d,28442,28446,2844b,2844f,28454,28459,2845d,28462,28466,2846b,28470,28474,2847d,28df9,28dfd,28e02,28e07,28e0b,28eb3,28eb8,28ebd,28ec2,28ec6,28ecb,28ed0,28ed4,28ed9,28ede,28ee2,28ee7,28eec,28ef0,28ef5,28efa,28efe,28f03,28f08,28f0c,28f11,28f1a,28f1f,28f24,28f28,28f2d,28f32,28f36,28f44,28f49,28f4e,28f52,28f57,28f5c,28f60,28f65,28f6a,28f6e,28f73,28f78,28f7c,28f81,28f86,28f8a,28f8f,28f94,28f98,28f9d,28fa2,28fa6,28fab,28fb0,28fb4,28fb9,28fbe,29931,29936,2993b,2993f,29944,29949,2994e,2996f,299fe,29a02,29a07,29a0c,29a11,29a16,29a1a,29a1f,29a24,29a29,29a2d,29a32,29a37,29a3c,29a40,29a45,29a4a,29a4f,29a53,29a58,29a5d,29a62,29a66,29a6b,29a70,29a75,29a7e,29a83,29a88,29a8c,29a91,29a96,29a9b,29a9f,29aa4,29aa9,29aae,29ab2,29ab7,29abc,29ac1,29ac6,29aca,29acf,29ad4,29ad9,29add,29ae2,29ae7,29aec,29af0,29af5,29afa,29aff,29b03,2a478,2a47d,2a482,2a486,2a48b,2a490,2a495,2a49a,2a49f,2a4a4,2a4ad,2a4b2,2a549,2a54e,2a552,2a557,2a55c,2a561,2a566,2a56b,2a570,2a574,2a579,2a57e,2a583,2a588,2a58d,2a591,2a596,2a59b,2a5a0,2a5a5,2a5aa,2a5af,2a5b3,2a5b8,2a5bd,2a5c2,2a5c7,2a5cc,2a5d1,2a5d5,2a5da,2a5df,2a5e4,2a5e9,2a5ee,2a5f3,2a5f7,2a5fc,2a601,2a606,2a60b,2a610,2a615,2a619,2a61e,2a623,2a628,2a62d,2a632,2a637,2a63b,2a640,2a645,2a64a,2afb5,2afba,2afbf,2afc4,2afc9,2afce,2afd3,2afd8,2afdd,2afe2,2afe7,2afec,2aff1,2aff6,2affb,2b08a,2b08f,2b094,2b099,2b09e,2b0a3,2b0a8,2b0ad,2b0b2,2b0b7,2b0c6,2b0e4,2b0e9,2b0ee,2b0f3,2b0f8,2b0fd,2b102,2b107,2b10c,2b110,2b115,2b11a,2b11f,2b124,2b129,2b12e,2b133,2b138,2b13d,2b142,2b147,2b14c,2b151,2b156,2b15b,2b160,2b165,2b16a,2b16f,2b174,2b179,2b17e,2b183,2b188,2b18d,2bdc3,2bdc8,2bdcd,2bdd2,2bdd7,2bddc,2bde2,2bde7,2bdec,2bdf1,2bdf6,2bdfb,2be00,2be05,2be0a,2be0f,2be14,2bea8,2bead,2beb2,2beb7,2bebc,2bec1,2bef9,2befe,2bf03,2bf08,2bf0d,2bf13,2bf18,2bf1d,2bf22,2bf27,2bf2c,2bf31,2bf36,2bf3b,2bf40,2bf45,2bf4a,2bf50,2bf55,2bf5a,2bf5f,2bf64,2bf69,2bf6e,2bf73,2bf78,2bf7d,2bf82,2bf88,2bf8d,2bf92,2bf97,2bf9c,2bfa1,2bfba,2bfbf,2c905,2c90a,2c90f,2c915,2c91a,2c91f,2c924,2c92a,2c92f,2c934,2c939,2c93e,2c944,2c949,2c94e,2c953,2c959,2c9eb,2c9fa,2c9ff,2ca05,2ca0a,2ca39,2ca3e,2ca43,2ca49,2ca4e,2ca53,2ca58,2ca5d,2ca63,2ca68,2ca6d,2ca72,2ca77,2ca7d,2ca82,2ca87,2ca8c,2ca92,2ca97,2ca9c,2caa1,2caa6,2caac,2cab1,2cab6,2cabb,2cac1,2cac6,2cacb,2cad0,2cad5,2cadb,2cae0,2cae5,2caf5,2cb0a,2d447,2d44c,2d452,2d457,2d45d,2d462,2d467,2d46d,2d472,2d477,2d47d,2d482,2d487,2d48d,2d492,2d498,2d49d,2d4a2,2d528,2d52e,2d533,2d539,2d559,2d564,2d56e,2d574,2d579,2d57e,2d584,2d589,2d58e,2d594,2d599,2d59f,2d5a4,2d5a9,2d5af,2d5b4,2d5b9,2d5bf,2d5c4,2d5c9,2d5cf,2d5d4,2d5da,2d5df,2d5e4,2d5ea,2d5ef,2d5f4,2d5fa,2d5ff,2d605,2d60a,2d60f,2d615,2d61a,2d61f,2d635,2df89,2df8f,2df94,2df9a,2df9f,2dfa5,2dfaa,2dfb0,2dfb5,2dfbb,2dfc0,2dfc6,2dfcc,2dfd1,2dfd7,2dfdc,2dfe2,2dfe7,2e06c,2e071,2e077,2e07d,2e09e,2e0a9,2e0b9,2e0bf,2e0c4,2e0ca,2e0d0,2e0d5,2e0db,2e0e0,2e0e6,2e0eb,2e0f1,2e0f6,2e0fc,2e101,2e107,2e10c,2e112,2e117,2e11d,2e123,2e128,2e12e,2e133,2e139,2e13e,2e144,2e149,2e14f,2e154,2e15a,2e15f,2e165,2e16a,2e175,2e17b,2e197,2eacb,2ead1,2ead7,2eadc,2eae2,2eae8,2eaee,2eaf3,2eaf9,2eaff,2eb04,2eb0a,2eb10,2eb16,2eb1b,2eb21,2eb27,2eb2c,2eb32,2ebb0,2ebb6,2ebbb,2ebc1,2ebc7,2ebd8,2ebe9,2ebef,2ebf4,2ec17,2ec1c,2ec22,2ec28,2ec2e,2ec33,2ec39,2ec3f,2ec44,2ec4a,2ec50,2ec56,2ec5b,2ec61,2ec67,2ec6c,2ec72,2ec78,2ec7e,2ec83,2ec89,2ec8f,2ec94,2ec9a,2eca0,2eca6,2ecab,2ecb1,2ecb7,2ecbc,2ecc2,2ecd9,2ecdf,2f8de,2f8e4,2f8ea,2f8f0,2f8f6,2f8fc,2f902,2f908,2f90e,2f914,2f91a,2f920,2f925,2f92b,2f931,2f937,2f93d,2f943,2f949,2f94f,2f955,2f9d7,2f9dd,2f9e3,2f9e9,2f9f5,2f9fb,2fa00,2fa06,2fa0c,2fa24,2fa2a,2fa30,2fa36,2fa3c,2fa42,2fa48,2fa4d,2fa53,2fa59,2fa5f,2fa65,2fa6b,2fa71,2fa77,2fa7d,2fa83,2fa89,2fa8f,2fa94,2fa9a,2faa0,2faa6,2faac,2fab2,2fab8,2fabe,2fac4,2faca,2fad0,2fad6,2fadc,2fae1,2faf3,30427,3042d,30433,30439,3043f,30446,3044c,30452,30458,3045e,30464,3046a,30471,30477,3047d,30483,30489,3048f,30495,304ae,30517,3051d,30523,30529,3052f,30535,3053b,30542,30548,3054e,30554,3055a,30560,3056d,30573,30579,3057f,30585,3058b,30591,30598,3059e,305a4,305aa,305b0,305b6,305bc,305c3,305c9,305cf,305d5,305db,305e1,305e8,305ee,305f4,305fa,30600,30606,3060c,30613,30619,3061f,30625,3062b,30637,30f63,30f69,30f70,30f76,30f7c,30f83,30f89,30f90,30f96,30f9c,30fa3,30fa9,30fb0,30fb6,30fbc,30fc3,30fc9,30fd0,30fdc,30fe9,30ff0,3105d,31063,31069,31070,31076,3107d,31083,31089,31090,31096,3109d,310a3,310a9,310b0,310b6,310bd,310c3,310c9,310d0,310d6,310dd,310e3,310e9,310f0,310f6,310fd,31103,31109,31110,31116,3111d,31123,31129,31130,31136,3113d,31143,31149,31150,31156,3115d,31163,31169,31170,31176,31aa5,31aac,31ab2,31ab9,31ac0,31ac6,31acd,31ad4,31adb,31ae1,31ae8,31aef,31af5,31afc,31b03,31b09,31b10,31b17,31b1d,31b24,31b2b,31b31,31b9c,31ba3,31baa,31bb1,31bb7,31bbe,31bc5,31bcb,31bd2,31bd9,31bdf,31be6,31bed,31bf3,31bfa,31c01,31c07,31c0e,31c15,31c1c,31c22,31c29,31c30,31c36,31c3d,31c44,31c4a,31c51,31c58,31c5e,31c65,31c6c,31c73,31c79,31c80,31c87,31c8d,31c94,31c9b,31ca1,31ca8,31caf,31cb5,325e7,325ee,325f5,325fc,32603,3260a,32611,32618,3261f,32626,3262d,32634,3263b,32649,32650,32657,3265e,32665,3266c,32673,326d6,326e4,326f2,326f9,32700,32707,3270e,32715,3271c,32723,3272a,32731,32738,3273f,32746,3274d,32754,3275b,32762,32769,32770,32777,3277e,32785,3278c,32793,3279a,327a1,327a8,327af,327b6,327bd,327c4,327cb,327d2,327d9,327e0,327e7,327ee,327f5,327fc,32803,3281f,333b8,333fa,33402,33409,33410,33418,3341f,33427,3342e,33435,3343d,33444,3344b,33462,33469,33470,33478,3347f,334f5,33513,33529,33530,33538,3353f,33546,3354e,33555,3355c,33564,3356b,33573,3357a,33581,33589,33590,33597,3359f,335a6,335ae,335b5,335bc,335c4,335cb,335d2,335da,335e1,335e9,335f0,335f7,335ff,33606,33632,3363a,33f06,33f0e,33f35,33f3c,33f44,33f4c,33f54,33f5c,33f63,33f6b,33f73,33f7b,33f83,33fa9,33fb1,33fb9,33fc1,34036,3405d,3406c,34074,3407c,34084,3408c,34093,3409b,340a3,340ab,340b3,340ba,340c2,340ca,340d2,340da,340e1,340e9,340f1,340f9,34100,34108,34110,34118,34120,34127,3412f,34137,3413f,34147,3414e,3417d,34185,34a44,34a4d,34a55,34a6e,34a76,34a7e,34a87,34a8f,34a97,34a9f,34aa8,34ab0,34ab8,34ac1,34aea,34af2,34b03,34b8f,34b98,34ba0,34bc1,34bc9,34bd2,34bda,34be2,34bea,34bf3,34bfb,34c03,34c0c,34c14,34c1c,34c24,34c2d,34c35,34c3d,34c45,34c4e,34c56,34c5e,34c67,34c6f,34c77,34c7f,34c88,34c90,34c98,34ca0,34ca9,35582,3558b,35594,3559d,355a6,355ae,355b7,355c0,355c9,355d2,355db,355e3,355ec,355f5,355fe,35607,35633,35668,35671,356d2,356db,356e4,356f5,356fe,35707,35710,35719,35721,3572a,35733,3573c,35745,3574e,35756,3575f,35768,35771,3577a,35782,3578b,35794,3579d,357a6,357af,357b7,357c0,357c9,357d2,357db,357e4,357ec,357f5,357fe,35807,35810,35819,35821,360d2,360dc,360e5,360ef,360f8,36102,3610b,36115,3611e,36128,36131,3613b,36144,3614e,36161,3616a,3617d,36187,361ac,361b6,361e5,3621e,36228,36231,3623b,36244,3624e,36257,36261,3626a,36273,3627d,36286,36290,36299,362a3,362ac,362b6,362bf,362c9,362d2,362dc,362e5,362ef,362f8,36302,3630b,36315,3631e,36328,36331,3633b,36344,3634e,36357,36360,3636a,36eb8,36ec2,36ed7,36ee1,36eeb,36ef5,36f00,36f0a,36f14,36f1e,36f29,36f33,36f3d,36f47,36f52,36f5c,36f66,36f70,36f8f,36fb8,36fc2,36fcd,36ff6,37000,3703d,37048,37052,3705c,3707b,37085,3708f,3709a,370a4,370ae,370b8,370c3,370cd,370d7,370e1,370ec,370f6,37100,3710a,37115,3711f,37129,37133,3713d,37148,37152,3715c,37166,37171,3717b,37185,379fc,37a1d,37a29,37a34,37a3f,37a4a,37a55,37a60,37a6c,37a77,37a8d,37aa3,37aaf,37aba,37adb,37afd,37b08,37b13,37b1e,37b83,37b8e,37b99,37ba4,37baf,37bd1,37bdc,37be7,37bf2,37bfe,37c09,37c14,37c1f,37c2a,37c35,37c41,37c4c,37c57,37c62,37c6d,37c78,37c83,37c8f,37c9a,37ca5,37cb0,37cbb,37cc6,38565,38571,3857d,3858a,385a2,385c7,385d3,385ec,38604,38611,3861d,38642,3864e,3865a,38667,38673,386d5,386e2,38737,38744,38750,3875c,38769,38775,38781,3878d,3879a,387a6,387b2,387bf,387cb,387d7,387e3,390f1,390ff,3910d,39128,39143,39151,39188,39195,391a3,391b1,39255,3928b,39299,392a7,392b4,392c2,392d0,392dd,392eb,39306,39314,39c43,39cbf,39cce,39cde,39ced,39cfd,39de4,39df3,39e03,3aa6b,3aa7d,3aa8e,3aac4,3aad5,3aae7,3aaf9,3ab0a,3abce,3ac14,3ac26,3b5c8,3b5dd,3b607,3b61c,3b631,3b645,3b65a,3b6ae,3b755,3c117,3c131,3c14a,3c163,3c17d,3c196,3c1fc,3c22f,3cc6d,3cc8d,3ccce';

  /** Desempaqueta las coordenadas a radianes, una sola vez. */
  function unpack() {
    var raw = LAND.split(',');
    var out = new Float32Array(raw.length * 3);
    for (var i = 0; i < raw.length; i++) {
      var v = parseInt(raw[i], 36);
      var lat = (Math.floor(v / 721) / 2 - 90) * Math.PI / 180;
      var lon = ((v % 721) / 2 - 180) * Math.PI / 180;
      var cl = Math.cos(lat);
      out[i * 3] = cl * Math.cos(lon);
      out[i * 3 + 1] = Math.sin(lat);
      out[i * 3 + 2] = cl * Math.sin(lon);
    }
    return out;
  }

  function toVec(lat, lon) {
    var a = lat * Math.PI / 180;
    var o = lon * Math.PI / 180;
    var c = Math.cos(a);
    return [c * Math.cos(o), Math.sin(a), c * Math.sin(o)];
  }

  // Nodos de la red. Latitud, longitud y etiqueta.
  var NODES = [
    [-34.9, -56.2, 'Montevideo'],
    [-23.5, -46.6, 'Sao Paulo'],
    [-34.6, -58.4, 'Buenos Aires'],
    [25.8, -80.2, 'Miami'],
    [37.8, -122.4, 'San Francisco'],
    [40.4, -3.7, 'Madrid'],
    [51.5, -0.1, 'London'],
    [1.35, 103.8, 'Singapore']
  ];

  // Rutas: pares de indices sobre NODES.
  var ROUTES = [[0, 3], [0, 5], [1, 3], [3, 4], [5, 6], [3, 7], [0, 1]];

  function css(el, name, fallback) {
    var v = getComputedStyle(el).getPropertyValue(name).trim();
    return v || fallback;
  }

  function init(root) {
    var canvas = root.querySelector('canvas');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var land = unpack();
    var count = land.length / 3;

    var accent = css(root, '--go-blue', '#44b7e8');
    var mint = css(root, '--mint', '#2dd4bf');
    var fg = css(root, '--fg', '#f7f9fc');

    var nodeVecs = NODES.map(function (n) { return toVec(n[0], n[1]); });

    var w = 0, h = 0, cx = 0, cy = 0, radius = 0, dpr = 1;

    function resize() {
      var r = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(r.width, 1);
      h = Math.max(r.height, 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // El globo se sale de cuadro a la derecha, como en la referencia.
      cx = w * 0.5;
      cy = h * 0.5;
      radius = Math.min(w, h) * 0.435;
    }

    var TILT = -19 * Math.PI / 180;
    var sinT = Math.sin(TILT), cosT = Math.cos(TILT);

    /** Rota en Y por el angulo actual y aplica la inclinacion fija. */
    function project(v, sinY, cosY) {
      var x = v[0] * cosY + v[2] * sinY;
      var z = -v[0] * sinY + v[2] * cosY;
      var y = v[1] * cosT - z * sinT;
      var zz = v[1] * sinT + z * cosT;
      return [cx + x * radius, cy - y * radius, zz];
    }

    function projectRaw(ix, sinY, cosY) {
      var x0 = land[ix * 3], y0 = land[ix * 3 + 1], z0 = land[ix * 3 + 2];
      var x = x0 * cosY + z0 * sinY;
      var z = -x0 * sinY + z0 * cosY;
      var y = y0 * cosT - z * sinT;
      var zz = y0 * sinT + z * cosT;
      return [cx + x * radius, cy - y * radius, zz];
    }

    /** Punto intermedio sobre el arco mayor entre dos vectores. */
    function slerp(a, b, t) {
      var dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      dot = Math.max(-1, Math.min(1, dot));
      var om = Math.acos(dot);
      if (om < 1e-6) return a.slice();
      var so = Math.sin(om);
      var f1 = Math.sin((1 - t) * om) / so;
      var f2 = Math.sin(t * om) / so;
      return [a[0] * f1 + b[0] * f2, a[1] * f1 + b[1] * f2, a[2] * f1 + b[2] * f2];
    }

    function rgba(hex, a) {
      var v = hex.replace('#', '');
      if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
      var n = parseInt(v, 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }

    function draw(spin, t) {
      var sinY = Math.sin(spin), cosY = Math.cos(spin);
      ctx.clearRect(0, 0, w, h);

      // Cuerpo de la esfera. Sin esto los continentes flotan sueltos y no se
      // lee un planeta: el degradado da el volumen y el aro define el limbo.
      var body = ctx.createRadialGradient(
        cx - radius * 0.3, cy - radius * 0.32, radius * 0.06,
        cx, cy, radius
      );
      body.addColorStop(0, rgba(accent, 0.05));
      body.addColorStop(0.55, rgba(accent, 0.018));
      body.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Atmosfera: un halo corto por fuera del limbo.
      var glow = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.14);
      glow.addColorStop(0, rgba(accent, 0.1));
      glow.addColorStop(0.45, rgba(accent, 0.03));
      glow.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.14, 0, Math.PI * 2);
      ctx.fill();

      // Rim light: un arco brillante en el borde superior izquierdo, que es
      // de donde viene la luz en toda la composicion.
      ctx.save();
      ctx.lineWidth = 1.4;
      var rim = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      rim.addColorStop(0, rgba(fg, 0.34));
      rim.addColorStop(0.35, rgba(accent, 0.22));
      rim.addColorStop(0.72, rgba(accent, 0));
      ctx.strokeStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Rutas sobre el arco mayor, con un pulso que las recorre.
      for (var r = 0; r < ROUTES.length; r++) {
        var a = nodeVecs[ROUTES[r][0]], b = nodeVecs[ROUTES[r][1]];
        var pts = [];
        for (var s = 0; s <= 28; s++) {
          var m = slerp(a, b, s / 28);
          // Se levanta el arco sobre la superficie.
          var lift = 1 + Math.sin((s / 28) * Math.PI) * 0.14;
          pts.push(project([m[0] * lift, m[1] * lift, m[2] * lift], sinY, cosY));
        }

        ctx.lineWidth = 1.2;
        ctx.beginPath();
        var drawing = false;
        for (var k = 0; k < pts.length; k++) {
          if (pts[k][2] < -0.12) { drawing = false; continue; }
          if (!drawing) { ctx.moveTo(pts[k][0], pts[k][1]); drawing = true; }
          else ctx.lineTo(pts[k][0], pts[k][1]);
        }
        ctx.strokeStyle = rgba(accent, 0.55);
        ctx.stroke();

        var head = ((t * 0.16 + r * 0.19) % 1);
        var hp = pts[Math.floor(head * (pts.length - 1))];
        if (hp && hp[2] > -0.1) {
          ctx.fillStyle = rgba(mint, 0.9);
          ctx.beginPath();
          ctx.arc(hp[0], hp[1], 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Nodos.
      for (var n = 0; n < nodeVecs.length; n++) {
        var np = project(nodeVecs[n], sinY, cosY);
        if (np[2] < 0) continue;
        var na = Math.min(1, np[2] * 2.4);
        ctx.fillStyle = rgba(mint, 0.22 * na);
        ctx.beginPath();
        ctx.arc(np[0], np[1], 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(mint, 0.95 * na);
        ctx.beginPath();
        ctx.arc(np[0], np[1], 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    var raf = 0, running = false, t0 = 0, elapsed = 0, last = 0;

    // Radianes por segundo. Una vuelta completa lleva unos dos minutos.
    var SPEED = 0.052;
    var START = 2.4;

    function frame(ts) {
      if (!running) return;
      if (!t0) { t0 = ts; last = ts; }
      // El tiempo se acumula, asi que pausar y retomar no da un salto.
      var dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      elapsed += dt;
      draw(START + elapsed * SPEED, elapsed);
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced) return;
      running = true;
      last = 0;
      t0 = 0;
      raf = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    draw(START, 0);

    if (reduced) return;

    // Solo dibuja mientras se ve y mientras la pestana esta activa.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.01 }).observe(root);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        resize();
        draw(START + elapsed * SPEED, elapsed);
      }, 160);
    });
  }

  function boot() {
    document.querySelectorAll('[data-gn-globe]').forEach(function (el) {
      if (el.hasAttribute('data-gn-globe-ready')) return;
      el.setAttribute('data-gn-globe-ready', '');
      init(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  document.addEventListener('shopify:section:load', boot);
})();
