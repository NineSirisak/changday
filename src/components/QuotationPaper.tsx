/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LineItem, Customer, BusinessProfile, BankAccount } from '../types';
import { generatePromptPayPayload } from '../utils/promptpay';
import { generateQrDataUrl } from '../utils/qrcode';

interface QuotationPaperProps {
  profile: BusinessProfile;
  customer: Customer;
  items: LineItem[];
  docNo: string;
  docDate: string;
  validUntil: string;
  refNo: string;
  discount: number;
  discountType: 'flat' | 'percent';
  vatEnabled: boolean;
  vatRate: number;
  notes: string[];
  paymentTerms: string;
  bank: BankAccount;
  signeeName: string;
  signeePosition: string;
  template: 'classic' | 'luxury' | 'dark' | 'elegant' | 'thai-navy' | 'thai-emerald' | 'thai-crimson' | 'thai-teal' | 'thai-charcoal';
}

const DEFAULT_LOGO = 'data:image/webp;base64,UklGRrgtAABXRUJQVlA4IKwtAACwswCdASoEAQQBPj0ci0QiIaEiJNGL4EAHiWNk/tdVO6x+tYpOOnmyoM/6jf5xxYfgg/u4sK0WwXQJgDNKon4o/uPbMgY7d9uHvXV1+uf2b9N+yHyJjW+untP+6/q35Y/Mj/M/6r2W+YB+kn66dbr+z+gL92v2091f+xfsJ7tf756h/9M/5v//7Cv0JP269Nf9zf//8pn9Z/2n7de1j///YA9ADiN/Kl9A+2fib+gfd/5z8uPkAw7/D+Bf86/Bv7H8wPy7/AH3meNPAF/If6L/jfzG/LPmZOA/3voF+5f1//e/ln8PM6Hq69wH+c/1//m/mrzw/4v/p+wH/TP8T/xfuA+pP/E/7P+O/zP7S+9T6S/6v+X+Aj+Uf0//Y/3v/Kf/L/Lf//6vPXv+2PsU/rF/8zNFVHw3drPElvQyX2+ZpIcGGH11pbth5Pj75A4vZ5kVBGMHpLc+CYZjFTvmkyT6cRSzJHDPOAZjMKENtOwHvbP7cEaMJ7+pJD3k71FrOihH/RpUHJuKasTYgBUJRC201Rg2A/JQlfz4mCNWN1V9XGXe6OWe936oFVFZE29RQQjUft45iz90FF9hXvmDHrurpEGzpnTiHpXew0w7y4xc8AMcv28qBqZtKk6QrzttxwACVSq0UL2oUZ2Lzpp+ooyKMLS8DjHUapv1V0f+dZJjIcMW5t2ykl42qWlyNEi/5pGplHddDFBYXSm/3DDid8G4JUUbkl9VYVY7F/x/BYmTDMEzEJfr+X1wdgT/JQnFt+q2HG0nE5ScFX4UKxKzggiG3Vi30Mn2aOOZkPvIcSr9betN8EppilhE12Th/yMaU2Gg1pcpx808JxxMC5KnIyf31MDcX0dwBrVdxXLFBpIxMDAsGniJRPIVWvEQTNX+vN+eCsfojOTi86pdnhigqekuACsoWzxEyUtFUe6nD7q5At888eODYxS0XwD/wZpCvPvxf3LIuSVRDxqS+A0zb8e1/x9qLOM9CCwCNJEbHmoCqOwOMH0OEt9NlnxCw3R/bb6gW3H1foMP0V9N0YFK BIyFca7KbFbearBFacTX82aco/KqFvAjRFtkzs1l6kSyn9mpLBZI2bOPItzVtKp6O/CL8i4o0KYUsfExS5dJ4sXlah+LnsrsaN4SgZPyb77B8xei7U91jcEGQQ8NPB/lVsIRY4s21BFTiidFj5qzKwU8dq69PY/L0IOgtI8FDdieKos5NeXbtnBXF3gfxVHHVvjCKapukFXsw4PpktcgHSbGzsreDqPab6LF4iFMAYRBpSIYQKQerYDfoTlqdw87bv0qoyuJjHgByItfGPSpEjsJgyQExrEDAVp+NHfUp2z8XVRoLFR7nCLns/GVbImdhzcdx/R+qrQwSdBFijduc2ja1ll7as8+Q28fHb24ZeDF6A0aoCJz6ur64tD0T8vBmHRU+6irE3czbk8/A+hJD9zk+L5K0P4UYjM1uNrtYW8r4euyXAA+5+RgqKl+NIDpYRgsszeP8g5vemvcCDgTTfpri2X0EBdOL45zw+iiKx6Ss5krHxA54otOb9IrOEK58K5NE0gOHGb2atj0EmYAlpz+gFRfI0BWMDgDbgfK5Ptf53aRKqSxZMNeKdtT1x+KYPkFTTUnN9DdgYgBhP40wOxvx2jsKX7Ari3AvH+DYNDMmFIB0t02AMr4msAC/64OvdtkcTfI8wJ16/CDPmO6toBl3AOKrFVNaRY/LCBlyjgs2Tj9XfTLtPgqYhchaa2kibUTpoJayWagib0OYSDT3/C+AWDl8ruBl7msEVqdGBR44dlLY6RC6Ox+ZditOWlFbpUTns2Pa/0oza6awEXfDI12D5Si+l72SPB7dMi/QuTyYmlPaBaFtVNSDV3zk0vk6TzJPIqlbRKcWUqpZaKy3S/J4o9O4T287cLQeHmKyDiv9Jj/oVMCOwgAA/v1eL4eDglIcrJDErwMoP44J8/0B/tDYcKBvE+9muXRU2GlI09q//oO1zWJu0359+SYauRJauyRb4CnVrk3VtyhBNQbQwxGLu1FDMhZTVANpqmrYqEBcMpomydUIFBeIiLvCVtDdz6rnzZS5wSJPfqfOgwL/+fgStwXwqzs3Tf3V86JERNSuVrFxdMUI0jQTqLNr8CKFGWd+j8Dln9y8nnGejDd0PcJU0kypq10rclx7S5P4OtKt71wst1Hw4jxXOK07wa2MaPM/lUZ1gVFu8GsQ4a5zmAXrD6NuP5gD+FrItsUEhlwubT+g3Ndu0Lll0L9thFLCINx9itu+s4TYzsniYlVMEvmla2Gcd4yE2lO1vdUrMqLl5H5tuiOyp5WBUVXY5vDx4jTv4qpS+Jrqo4TLQhxY0gNlWCHvZfI24oeXL4kfgsi/K7PX8f89R008mfTTQ7euz0njpU11/7zmPhOR0WyToMPrkMDIHfQ4y0ZAlJlyDp/+ebfysla47OBUHcd3SxqhiFGtyzSvpCZxk7gidV88QvR0IozOR/j3hQbs+omeLWwDyLQxdWMVELj8EtAFIf8nhF2VlnNtjcNC1lBrogxMzmxhDf9gZQo2BVOv3fCLwtff4RWu0clsHCjXeE1ooBjR92ohDeHnegAjEizSCKziU2l1tOVQsb0AHPr2q05g4G39bJA66n5sJVXD1C7jMq+aZyC+4jZx52bdA3QdxVigAugpY1LekvuVW1JgK6kPCYw51XZmgG5FnbkgoaDJSHcq/2dyG8qlBCkmWCUN1CCSiU8JXu7pvf8ptLNcU8pqkJ7Rc2F1gf0X9j4xEy++sjFqgQw9VnDFbb+FW9MH59J4wSoTKQtM7+2FEf38S/3AxXx4k9x8QXRsiDHbMsEfoBP3nQbj0+qvY8L1oQ0vqFK4xwYuOgs2DkEx8CJWSJ094472BTA1bCv4UOuiN5P0aY7zE5t88gskZAWpKB2iWQchrmNzGEcp7LBqA4w225enUk8JMbzdvIF807skDH+eHi1hMjC1/2yd3R9/8OfH88/Kpg9Oub1LrFokeshzey6LXhkeD4nPMUaXnHCcqudyjhA9mkgRfH7bjSOiVUgZ39XLmM/VajRVRwC2pXSjwUzje4aoWLeI2rC36/6Mu4RTuqOShDJJRXHnDUht2EqfwL+d2rTPRw8gguIqC8r3cbfAw2uT+w1thefBf+WUwzcVn6ceGn24tEuID+y+Sx6yvXbipN6LkdklX+OTD9FGw4xiRmNsWbiubz7r/Hvtx9lBCwcA+rH0uDBCMK6qkwPvy4niVI1gZA3ybBZJ1NkN+vaBOhe43RW0RXZRZiAjFAjPjBVUfUMWoJ0YvZnlbCm2tz0xwcNxN00lOpKLoWT9n7B6Cu4D3VH9maYzL5aagtvlx1DuI48MXqECs+KSNuzjxbo6OeJ7Ua7dhvLJ+AdcZl/ogbZEwXWxCKVcWq7/mCVgobEOnq67TZjtDvtkfbX1MtLyXZ0eqnLbnXEnvh207hyPu7/7cwN4bDCzTjYjpLKs6bssjalqqX5P7p0cKIdnS5MxIH2g8iKfc7mRIzTRWu7I2S27Mmt2X6S7lXiLylHTZK818/ytiIeni75ClIiUNmVNKAPAdbvAyH5lPSjtPTAnCWwwCSV9EaccXeiHHBvUzzJ6KkNO05d/+T3R3vaY3mbHLDerd0AW8acCUBgpr+k9xU6H3AWcrUKMVHzckZ6IU4Qjtc3TXSSagl/WJQjV12PuOWnho2f3enDYShCjEhTLDhLYE2xzitMZNw3G3YIitfxADTZKdDXsNfts101kI6jLGnAyS5tODLtxkoXhphZj83beQ7czoIiwhvzf7M3rQMUfiefQ22dpddRcqVAGB8Ji68FLpNADopNCIsjoueskE0WehZSmxVCA9acgIVkOxkpOmGIuNzm4H4ERtsNNpmqMlGawANfQNPAxbv5WrCnDLmpGcGp4IXDGIXFfF7CYxflCLi7tkCCBHMDg5kvUVSFl2en4fLf1gGnBDtb11XPzh07xS88JWk05JtZlKkj2j5KefuTn4E3gslGyDAMGxinPaBgkxw2j0DzrGRgQR3lmQlfJEnaC3AK64Hl2e5c7QTk6uiv5C11+p15gTYTnb0Ah+8S0Hxcaymow2VUKy8L0VyRp589UlRFxJ2vgDd9sSon2VM20JB9IfS1Uz7GzNGbE32GlxQ8528d/NBJyHUx4fexm25KfYH5KSjnxo2S4SZFrL07C3DVmtQXahGStPbdb7mC3wRXr7hpCpbSNtgRvm6rvEzNjtmOvbXwA1okspHwnLxhtyd6BbC3JKfHIk5H3P/pMLlA+EMJiPa0NP5RLJ5EG5RZ6aQkxKS/qfcbSgdeZErfEE8Cr9FLz4TopJBQtz45BmLvw3Kbn6cbQf8+752PIjtFXKeAbCgYodUFQGokGHM2/TTAvJy9jyliYhuzHOkPHz+Z/iDBqULPKB3qCfTQEf55n+/rp2oEkvxtljXnUSe9cEJfcKS8yShEKG3r25NOtHnwUhsg6Icn8PDXpeJYh/9rTeQhRKDn9v55ejGdh5ABBLy1i0jV3FAmioh39w72RtZtW257zFPFVEc6UM4JEaEjqof1rFux6WtjFooQQVm58YttZzuHnAcKDMtE5xHXhHQT+ItrdZRoVApPB8YPxONufFPXCTd8h0QV65BAJDEWXA28z0xfVJyiqEwvnJCLh1yrXMU6Vh4vvMLdfX/uya3keLGwUD7PGVdhBRtSfRx3Dzv6rh9EVVWHrS4voAyF5hdG7w99YzDW71PJ665b6xTu6v4szceRcaAjsX3UoTIVUqW62y7PgugPuNn4V8D+Rtfk4dpuvsVetSrb9FiU3k5XlgyHNtWpu/oigwEGmBR3CjHKKl07kStwUPPZO72hGkpFx5RZgYuxVqFtPM6i4vxBytJ0Zz2DqtbEayE7lgbERQdn5hn6b+m+jAdY2obesxLoLsZdW18zB1DltB0IM2xeIhq4beGsuzZcumkBJR4CafZLPr7o50pimIMVpJCaUW0/DdvjE1zV5pV3XTsz1b6icJcXTLJW+nFxV62G+F8HDtbsuWV2Cvmw2JbIlxzJvvWVrfAUWDgmeg7pk7wp3OBCn7FTT468yKa3rRvJymFYQ0vQTf7SV/tJ//7QfiEopu86Pd3dMsQSdB15uF+U7tHarkNS8PA0PytMaXEjHrKLWO0+p0Y4N2iP+Dkc/IHqxyfnrYW7D/J/t6u5J7v5rkZSV4zixxstldgXfSDRTKy+sSpOpYql9Qsvqj2Xc3kzB6kr2KebQWiaL31fSa3pRE/KLON+96Y3G8Vl7qkQ45A5XLzs3hwz15bao8bRZjZm4d2mTCDWfhwF76EvhUv+3MKSdZFDNToYp1sYYsDrAJ14UO+SFypSUX3PaWE035W6DuYKWKVtAHOpGMBJXPycxDl71n39Nvv8s5zS4bqtd16sA5RInrWw6h4x8Hz5I6yX8BJKg9sCeZMWHhjCQC2AeTV5Y4ywKEQ8uI+M5XUVQsDBQvvkZ892ApD2M5Y5DP8sKN+K/tbzg8cRRW2eD3HgF2ngC5G0V5fF8vxLIU54clyvSimUwF4hAhNipL1fFwvNwg4ers0UmWbdL1qzr0DyuYMKvz3zrL+svCYiy3evSOg75ei4RakEhjGspLSgo7OgXMyT3TRS814evsd7rCZexPqtsSYgKixFBqP8/Um7+4Jjf4DRd/g2pzcQdHFb5Mn94UJice3+Mpjk3XKZPNg1QRy3GnlOK1hJsF0taqey+wy15r6lC39zzKW6CmRN7+zAzhfQlBL3gDqo9kadLi2I2tKJeSnvYJvopJ0tcblU4GIqn7LAWof/rqEZGLVJ0fSbgT1ThPpu5bI4iMHh9HzcYN/+6DtlOYxj4784nuovrxC5BM5yb8nV/Vdo4h0fJzpDC1ZBaAOmEbydmcaQyTVMnE2ybq978hhQ33hHvjUYWbdPURtgYoz4XZoa5HiDxbSEgFZlP2aRoEbQ1q8s/DI5qviskSDaVdSNqH8uE9jkMdYADdzGHKkkhN81IH2Ol5K/gZnC4iMYqfAqQzP/OJjh76Tie3R+qXYjeowmtdb3CUXNNjYwKbnWnnlDn78xyt3pBPyzx0L/8C/DEeRs6dOpd7CUgUR8ieWLWd0v9U5D5j/kBaucasV8OGbQgK+DIdFQKbjfsnqpSVLsvBpkGtDDYuTJ8awthM332rYVnUXVXlmh8Oz/V5iJIpapLHC3uFCIQQVLb1VyhIb9H5sEgR8olTAXLxVSP9jWN5kzsXE5NOE7g/Q4zSnR3DfPGgwC/7zi/lEUDVjVmp3yp2SaDW0R2QwMrbUcUeMFjbV889AW00QlmH+e7+9DM9CfEWmfBDQxc1Z23NYN4AMDZZZnU/s9Qya0UGYXZzhob56F1YF4ouAGK0CZ5yAiNm2ZPySgvVJNhnjsxYfaTTkxf6/Oox4ntdp9K4Q7piUQ8FrznwrhHQUDyQo5n24xGgfE6ANOXBgeGSZA4zYCP8M7Qd0SFPBGIWrE4mOqO9ErTvIKJEiqai9RZQutVkfhPJWUWWqhvE+EVuEdikgHKVC+XPUZkEL9UVK45BpHzjA10gZLaW2S9nuhI2tp1dXzNYmIEy2gL6bOqXpKRCM7R/vF9PzYjmAC/E+Hl9SC3k3X8nhDQpoqfPw6DdocNxd8HsQfnNS737M1pl2s19nyT5M+U3A71IZrUnz8BhFgIJTW7t3IomOUjYrajTolnwCW4SVbi2/LvG6DMdHSmGyLiH4ny30WD2jyVkw2Q2I0tqbL7PARQ406FfSuCS6GD6llS0I6YZeCTYmtDfxAqEfzAfPOJUBGxwiY31DtDIxsAbF7vf46oqO4Xfeh7WVGO9yM6M4nMOIXGBihA/QJ0BEX//7bAzDsKJMPKZCx6lv1z/GHC7TWL9fJ1Nez/ofbJMvguXsTgsYYYmMrAApyeM7bfCst7XTJXmpXHHUh9mynTtzZB2IH5RY68m8J/AmFecKgWhe6ElbKJnKKp7XYCScbvD09JSwTXrtAN0NlpiP5AdT/rLG+JJXRLKSF5H1ceqaKWsTcgwkq1VujqtKJbG8j6201QFz34jxrzcinWBybexWwTCYEUx9BvPduJanT67a9bMxCVbNQV+WH7A7Z0ZNic0RlYNA1KtnT7voE+ijzCYFonmOAYABJM9UlvR8w3lbK7aKrLdijDAlBw96VPpVpe+UInxWffEXj0JTXbHPJFn5o7sEc3YMC6xoVzcRXB4ErM4jPyvrDgDF2deogxwvYByiPhcAnvmWGotUun7WpOJKyCnkNb0DutdN5lWJERNLjENWWrly75pkkh0D8oDTRNbGn4EE5BR/Bf/obFXwjdt5Qkka43Suk6e/1YTw3sIsEHNRnUGQzUjL9Uyng3QUTiWymTR5BDUPWf4I6K+EMHaOJIUtaPYcDGFs14/7XP0rVkRitCyRLDlhMETUc9HQ8QYl5UE6kmQW7YfuhrJ7qpio+OzVxDxGOyjY5nbBg+6J/HovTbnOTSbFGmFdNr1LorfQBpjfoXIPmDHGntom6XQcm0Q0QULOJ13H1mI7WBU2bKTaIMoyXpjNtKy/hGsTZTviMXPYa860vx0003C6vNCF7+ReI8z4bGHdtzstXmuRxDE3vGIMLpx1fmChdWd4vFZuXZg/FH61mMuPEVDxXeVmLbAblTlQwlmQ2l68p2LH+8ETErAMdP1CJ3T6rU5tfeuP4P9E+0BNMl3Kk+UZfeRRIDiCJ0a9pEQS/PneqZuhoX3TeysGf8a6I/3bWT+mPSkHU0Z+n34Uazr8Mi6+5KSn5isls6trhoGS+J1KaxLJC/zz1t0SUZb5ezsAVaMCzPPlOZ1fgySFu3ngqjgw60wm0apaV+ugC3H/8UxBIOzf/wjWL83TmGAeOPRfsGEtmD+pFV6NwQoTHHijSBWS4yM1yS/4X6yeMXFVDRmJXyyWpfY4jBLOL9LWWkeqXhjD54mpUnzf43Z069N0KRZc3zUvYwO75MrSQHoDVPGdnrJwTKKTz4nNmvK2uvny9lf4Yux0u00V8OQDyo1Uf7c810VHS241tXu5+IZoTazCf4Ahw+LRVAXhBXVPPpJi36wmp8ULXWkTm/eFjlZQBP+D4UfJjYcyxfLjrw6GbXrMSY/gBwuRu8MbLlb2ys1kJz8q8qkk67iyp6CYG0cvIV3Qsi5xvEOwiqWgRQ+19WVKdLEymTY74+xU75hv0iw32HpoIB01fO7vwn8igvIDJsSGqiuCMVaQTiAwVGPEx4Aju9dSXNZhmDCPCpp8I06GhRxstqVO4eyc0h2fJkwczwqLOj38HgpdFncwI8PZVT0n/qvHkWzGwhihygEyLCyYbVHvWhYh0BOX8Xn6snAvspEGPfm7JyuzP27WdIP4NmO5l9ajaQ5iRh60RxTvaUhaQPOTossfwbcw4xcjdBauuESkqmhabgl1KVlS2fdEpAzUk4W8vrbC/+b+HboDuf9nC/Qp0M2XEsRbOLoDQCUqHxHAwtauAGnLiOc1aYDri12GdZrBB+vvczfjsLCwRI9Qn1g0oYvTgcGpHe+60zv7qhyTFAnYAAV9Qypdf2IpJqS5aPdZiTZd4TLAdQanDidGflfUSqfGSsqFuhUVxIiYQsbays8m7RHP8Crn4DIYpvKISt4vlsHNnmXNk0hOf4plxzKmHkQgQLwOneXvkwTRFVORfUxXUlZN8udR7TSPMhY+Xg218MsU8DT8HOqfrn7bmKUAAOGr85YnEF4snvnEiwkrmei0iWALgDFOq//Skl3JOk0UANcoQDofBkkIlbohyhWNf9nLb/n56NZ7KpRNJGY5ZOlgcAPMXLeRJWL9VnK8DMe5ANCmfxmNgQJFl7TxnNUp6ALRoeTdk79QZjuMTUHDfDc6WugODRlohgI+k2yFfmEYTMXy2S5QH7YvL5FQ+34SB4RFmv6MoXaf1qtL+paG/y3niJDT4/zu7l7WoSpy+0K/u2bRRvsyjlQpk+2A+6Cl8JxaXwZrIfO1050JZBsvA3JphGDWXzxkZ+ZrfWL2lcNTAbflnyj4UeCdzLDMZWVlmZ4U0p9xec8yc9HUSkCGm5w2HlSlBNeJSA8G1MG3Bk5K4/nii87GVVKWQi4lR+6aUJdT/IuSGAOykScA9IPPHY/xLz6DUIBlrvWRRJyBq0rlXBTCTBu370UYrHs8ry3M/vwtY97Fq7iop66OjNEoH5AD5ijct6IUfTrIhACljmyFrrT50QAvgLTfCVIBDs8GDCxQmbkJcRNkLMNWk4gJXhDSV7tmKxH73K/xx4JoTM5C8JfLZu+xT7DEMUECz8GWQ/OWqzI7/zctkPhzNEihjnf5QdaRL0nuOB4jCJfdPPKpv7MumoBUuELPjxNUNffIG8qHT6Om/pvCl+3AhykG/cnSO16CV4viR4dlt3iw1kIjFAVmSRP47ZRkwxTAWbqVkerjca9X9w15XBzCtr/VGKIPpV1N5\n+d5v4Jw/A9TPNA/qMLXzBzK05asVQjAeudRPJC0F2T/cIo1RLVGZ9I5Vx1ubIBUrFVnsaAaCKBAip5IXCoXkOMrVrVFk8V//cXHMkm1JOzYx8WPJRtmfjeLrHetibrP9Zwc7MwX65w2yi11hVLmAuv+Yp7OvbmTJLyvkaC57GteYf/Hym3vPKzEyP6EsLQKAoobv0QILoB5e4Y2lTKItjsWIkaLIBGSVFdtsP/Cr8veQyCCI8P/P+4a6YATo2lnBGSZbGg/5eHsnxdk/g2mIeEwImxzepzh1egTV6D2LMlOhACSU71Fup9q/OB3PemJz8gEGR91BKaoMbb4wIT0/0ZIaupbwlc6W2ZMidtNBu+ddDU14nGb5CwQ2zEIXssCgvgcNmHIBsM4U2oYvM4MtJx7iSnZjdRBtdmCOf8xz7Ly96DN9hR+RmCTldznTRvoamzi7mms3nEWeShYoE4S3Ebmn1LoDpl54p/tBDzPfG1k/yy3BR7JP502xQh2NHe5XeiGH8ey2QR2R6u+wi1ZGvnbhProknXSAL8qnNK+5Hks36jr1VxHNY1VcYyzRZ9x81ol25G41dHIyVtISwsQDIWW1gLvBTjhIyi+LfblDWZIwDa2XI9hqtcqkNpqwm95rprj4AiOt30xPiGv5FGrvhoXz49f2harhqa04uSwa5YAIDXRKmll/yrrkfFR4QDejp1EPX02clG7S/svlkffbIghsNdL+/H4WoNbZGu2QCWfO8UEPCqTColCiFrZ4O/9s+UquOQl/ttDoU5Utqc9Ms2JmPbVhIPDDnqli/xRxK3XrYKHIp8Di6zLA+g8ovoHqe/9cS2v8JkwAoEmDtY0P4u5d4N6cueU9NZu1Bp0EJPwhtVYc2NDzfCtluXuf8ExpewqPKKXUQwqEoHFUD8+ZM9MSijAGKUyL+ab648CD+Takh1T7f0MSJc+GaQcr1Oxj2HtZ+5s5Kzcuz2NMnjLg/rQs703j0MMpvtZGguRZfT7h7TdRVqlHbbFCJ6TVVtDqs+gpyV3vj5QJNjyqsaGPGj2EVux+byzL6pYsOa3sk64FXzZi0Pk/gTcaO7z25a2stClNOB6t+GoDDJXLxHygkB+20wjxSmfDYx0SpJwkLKuZFsTlSvkXWgf8ojzduQFjWZLWbWsaEX68jr2qPWaeDo4PQ5W75Xc8En5syOgj1V4AUoiBv+4j3aqWa3cAv1nNFlp8P2a6gbUPD3fP1BNRlDaDOdQfAv29wnw5DAHpSqtEJSiFdLgOzRvcEFK2almFuYC98LShBoY56Ssaoz6dEVvz2Z/N069fto3JE0+twNACU4RVE0q934RHVJBhmGWHAsbhYiapQqCfPkrw/GPIHLtl9vK2oWX8ax5092XtBHK8xF1+gEuMbn2v/CQPh7n6KH1OsTnNk9gZ5MitNMGa18E3vqWWlK95GbZtOf9K0jdlcEyoUrsW4vK2cwqBrsPHcAFe58vE2e75Lz+7s/m/pdGArCxZYX0ZGBVHlAAkAT8aDQRHxkW4dFP46MlUEOuu0a6rDbGGS7bmMLKmJlbbu18Q0l3RSv5hvZDKW5LS/8U0KlWZPWi8dFS/Fl8kz2mncxP/w+NeXGW3WPykI2/9gjAUSrLXmyjXGVWPzaP3kKBMzNo9wYcTJNhrs4tRAvwlOJqxPj/+/Oxh0Fwtkdc6+R+xaFRJeA4lv8KnTaVsgIq5e8DTvPjMMWu3/sEuQqjNOw0j+v7qXoPhccN9zMNHr3q/ttwpWTL8PooR0YLWPzOgVPk+Xhs3ZdtWJw3xtHRx0WQJjSeRaMf8z0uqcl+kZFBorp9Ce8uiJfYBs5XuBlo97VB8hSFmUvSjcwKdhHxWzLT7E5Xj+wHePftNsmP7f8ySgZ5Tp05T2OHy2nx/11EPjf0rBCrnNUD5rrHdEB9Bn7xMhVsnoKO6CzRwdPSyUchwk5AwM5V/OK1eUifQobCJKuQZdOyBe9JUHYMsf/lJqV5/Uhh5moveQyCCI8P/P+4a6YATo2lnBGSZbGg/5eHsnxdk/g2mIeEwImxzepzh1egTV6D2LMlOhACSU71Fup9q/OB3PemJz8gEGR91BKaoMbb4wIT0/0ZIaupbwlc6W2ZMidtNBu+ddDU14nGb5CwQ2zEIXssCgvgcNmHIBsM4U2oYvM4MtJx7iSnZjdRBtdmCOf8xz7Ly96DN9hR+RmCTldznTRvoamzi7mms3nEWeShYoE4S3Ebmn1LoDpl54p/tBDzPfG1k/yy3BR7JP502xQh2NHe5XeiGH8ey2Qq2R6u+wi1ZGvnbhProknXSAL8qnNK+5Hks36jr1VxHNY1VcYyzRZ9x81ol25G41dHIyVtISwsQDIWW1gLvBTjhIyi+LfblDWZIwDa2XI9hqtcqkNpqwm95rprj4AiOt30xPiGv5FGrvhoXz49f2harhqa04uSwa5YAIDXRKmll/yrrkfFR4QDejp1EPX02clG7S/svlkffbIghsNdL+/H4WoNbZGu2QCWfO8UEPCqTColCiFrZ4O/9s+UquOQl/ttDoU5Utqc9Ms2JmPbVhIPDDnqli/xRxK3XrYKHIp8Di6zLA+g8ovoHqe/9cS2v8JkwAoEmDtY0P4u5d4N6cueU9NZu1Bp0EJPwhtVYc2NDzfCtluXuf8ExpewqPKKXUQwqEoHFUD8+ZM9MSijAGKUyL+ab648CD+Takh1T7f0MSJc+GaQcr1Oxj2HtZ+5s5Kzcuz2NMnjLg/rQs703j0MMpvtZGguRZfT7h7TdRVqlHbbFCJ6TVVtDqs+gpyV3vj5QJNjyqsaGPGj2EVux+byzL6pYsOa3sk64FXzZi0Pk/gTcaO7z25a2stClNOB6t+GoDDJXLxHygkB+20wjxSmfDYx0SpJwkLKuZFsTlSvkXWgf8ojzduQFjWZLWbWsaEX68jr2qPWaeDo4PQ5W75Xc8En5syOgj1V4AUoiBv+4j3aqWa3cAv1nNFlp8P2a6gbUPD3fP1BNRlDaDOdQfAv29wnw5DAHpSqtEJSiFdLgOzRvcEFK2almFuYC98LShBoY56Ssaoz6dEVvz2Z/N069fto3JE0+twNACU4RVE0q934RHVJBhmGWHAsbhYiapQqCfPkrw/GPIHLtl9vK2oWX8ax5092XtBHK8xF1+gEuMbn2v/CQPh7n6KH1OsTnNk9gZ5MitNMGa18E3vqWWlK95GbZtOf9K0jdlcEyoUrsW4vK2cwqBrsPHcAFe58vE2e75Lz+7s/m/pdGArCxZYX0ZGBVHlAAkAT8aDQRHxkW4dFP46MlUEOuu0a6rDbGGS7bmMLKmJlbbu18Q0l3RSv5hvZDKW5LS/8U0KlWZPWi8dFS/Fl8kz2mncxP/w+NeXGW3WPykI2/9gjAUSrLXmyjXGVWPzaP3kKBMzNo9wYcTJNhrs4tRAvwlOJqxPj/+/Oxh0Fwtkdc6+R+xaFRJeA4lv8KnTaVsgIq5e8DTvPjMMWu3/sEuQqjNOw0j+v7qXoPhccN9zMNHr3q/ttwpWTL8PooR0YLWPzOgVPk+Xhs3ZdtWJw3xtHRx0WQJjSeRaMf8z0uqcl+kZFBorp9Ce8uiJfYBs5XuBlo97VB8hSFmUvSjcwKdhHxWzLT7E5Xj+wHePftNsmP7f8ySgZ5Tp05T2OHy2nx/11EPjf0rBCrnNUD5rrHdEB9Bn7xMhVsnoKO6CzRwdPSyUchwk5AwM5V/OK1eUifQobCJKuQZdOyBe9JUHYMsf/lJqV5/Uhh5moveQyCCI8P/P+4a6YATo2lnBGSZbGg/5eHsnxdk/g2mIeEwImxzepzh1egTV6D2LMlOhACSU71Fup9q/OB3PemJz8gEGR91BKaoMbb4wIT0/0ZIaupbwlc6W2ZMidtNBu+ddDU14nGb5CwQ2zEIXssCgvgcNmHIBsM4U2oYvM4MtJx7iSnZjdRBtdmCOf8xz7Ly96DN9hR+RmCTldznTRvoamzi7mms3nEWeShYoE4S3Ebmn1LoDpl54p/tBDzPfG1k/yy3BR7JP502xQh2NHe5XeiGH8ey2Qq2R6u+wi1ZGvnbhProknXSAL8qnNK+5Hks36jr1VxHNY1VcYyzRZ9x81ol25G41dHIyVtISwsQDIWW1gLvBTjhIyi+LfblDWZIwDa2XI9hqtcqkNpqwm95rprj4AiOt30xPiGv5FGrvhoXz49f2harhqa04uSwa5YAIDXRKmll/yrrkfFR4QDejp1EPX02clG7S/svlkffbIghsNdL+/H4WoNbZGu2QCWfO8UEPCqTColCiFrZ4O/9s+UquOQl/ttDoU5Utqc9Ms2JmPbVhIPDDnqli/xRxK3XrYKHIp8Di6zLA+g8ovoHqe/9cS2v8JkwAoEmDtY0P4u5d4N6cueU9NZu1Bp0EJPwhtVYc2NDzfCtluXuf8ExpewqPKKXUQwqEoHFUD8+ZM9MSijAGKUyL+ab648CD+Takh1T7f0MSJc+GaQcr1Oxj2HtZ+5s5Kzcuz2NMnjLg/rQs703j0MMpvtZGguRZfT7h7TdRVqlHbbFCJ6TVVtDqs+gpyV3vj5QJNjyqsaGPGj2EVux+byzL6pYsOa3sk64FXzZi0Pk/gTcaO7z25a2stClNOB6t+GoDDJXLxHygkB+20wjxSmfDYx0SpJwkLKuZFsTlSvkXWgf8ojzduQFjWZLWbWsaEX68jr2qPWaeDo4PQ5W75Xc8En5syOgj1V4AUoiBv+4j3aqWa3cAv1nNFlp8P2a6gbUPD3fP1BNRlDaDOdQfAv29wnw5DAHpSqtEJSiFdLgOzRvcEFK2almFuYC98LShBoY56Ssaoz6dEVvz2Z/N069fto3JE0+twNACU4RVE0q934RHVJBhmGWHAsbhYiapQqCfPkrw/GPIHLtl9vK2oWX8ax5092XtBHK8xF1+gEuMbn2v/CQPh7n6KH1OsTnNk9gZ5MitNMGa18E3vqWWlK95GbZtOf9K0jdlcEyoUrsW4vK2cwqBrsPHcAFe58vE2e75Lz+7s/m/pdGArCxZYX0ZGBVHlAAkAT8aDQRHxkW4dFP46MlUEOuu0a6rDbGGS7bmMLKmJlbbu18Q0l3RSv5hvZDKW5LS/8U0KlWZPWi8dFS/Fl8kz2mncxP/w+NeXGW3WPykI2/9gjAUSrLXmyjXGVWPzaP3kKBMzNo9wYcTJNhrs4tRAvwlOJqxPj/+/Oxh0Fwtkdc6+R+xaFRJeA4lv8KnTaVsgIq5e8DTvPjMMWu3/sEuQqjNOw0j+v7qXoPhccN9zMNHr3q/ttwpWTL8PooR0YLWPzOgVPk+Xhs3ZdtWJw3xtHRx0WQJjSeRaMf8z0uqcl+kZFBorp9Ce8uiJfYBs5XuBlo97VB8hSFmUvSjcwKdhHxWzLT7E5Xj+wHePftNsmP7f8ySgZ5Tp05T2OHy2nx/11EPjf0rBCrnNUD5rrHdEB9Bn7xMhVsnoKO6CzRwdPSyUchwk5AwM5V/OK1eUifQobCJKuQZdOyBe9JUHYMsf/lJqV5/Uhh5moveQyCCI8P/P+4a6YATo2lnBGSZbGg/5eHsnxdk/g2mIeEwImxzepzh1egTV6D2LMlOhACSU71Fup9q/OB3PemJz8gEGR91BKaoMbb4wIT0/0ZIaupbwlc6W2ZMidtNBu+ddDU14nGb5CwQ2zEIXssCgvgcNmHIBsM4U2oYvM4MtJx7iSnZjdRBtdmCOf8xz7Ly96DN9hR+RmCTldznTRvoamzi7mms3nEWeShYoE4S3Ebmn1LoDpl54p/tBDzPfG1k/yy3BR7JP502xQh2NHe5XeiGH8ey2Qq2R6u+wi1ZGvnbhProknXSAL8qnNK+5Hks36jr1VxHNY1VcYyzRZ9x81ol25G41dHIyVtISwsQDIWW1gLvBTjhIyi+LfblDWZIwDa2XI9hqtcqkNpqwm95rprj4AiOt30xPiGv5FGrvhoXz49f2harhqa04uSwa5YAIDXRKmll/yrrkfFR4QDejp1EPX02clG7S/svlkffbIghsNdL+/H4WoNbZGu2QCWfO8UEPCqTColCiFrZ4O/9s+UquOQl/ttDoU5Utqc9Ms2JmPbVhIPDDnqli/xRxK3XrYKHIp8Di6zLA+g8ovoHqe/9cS2v8JkwAoEmDtY0P4u5d4N6cueU9NZu1Bp0EJPwhtVYc2NDzfCtluXuf8ExpewqPKKXUQwqEoHFUD8+ZM9MSijAGKUyL+ab648CD+Takh1T7f0MSJc+GaQcr1Oxj2HtZ+5s5Kzcuz2NMnjLg/rQs703j0MMpvtZGguRZfT7h7TdRVqlHbbFCJ6TVVtDqs+gpyV3vj5QJNjyqsaGPGj2EVux+byzL6pYsOa3sk64FXzZi0Pk/gTcaO7z25a2stClNOB6t+GoDDJXLxHygkB+20wjxSmfDYx0SpJwkLKuZFsTlSvkXWgf8ojzduQFjWZLWbWsaEX68jr2qPWaeDo4PQ5W75Xc8En5syOgj1V4AUoiBv+4j3aqWa3cAv1nNFlp8P2a6gbUPD3fP1BNRlDaDOdQfAv29wnw5DAHpSqtEJSiFdLgOzRvcEFK2almFuYC98LShBoY56Ssaoz6dEVvz2Z/N069fto3JE0+twNACU4RVE0q934RHVJBhmGWHAsbhYiapQqCfPkrw/GPIHLtl9vK2oWX8ax5092XtBHK8xF1+gEuMbn2v/CQPh7n6KH1OsTnNk9gZ5MitNMGa18E3vqWWlK95GbZtOf9K0jdlcEyoUrsW4vK2cwqBrsPHcAFe58vE2e75Lz+7s/m/pdGArCxZYX0ZGBVHlAAkAT8aDQRHxkW4dFP46MlUEOuu0a6rDbGGS7bmMLKmJlbbu18Q0l3RSv5hvZDKW5LS/8U0KlWZPWi8dFS/Fl8kz2mncxP/w+NeXGW3WPykI2/9gjAUSrLXmyjXGVWPzaP3kKBMzNo9wYcTJNhrs4tRAvwlOJqxPj/+/Oxh0Fwtkdc6+R+xaFRJeA4lv8KnTaVsgIq5e8DTvPjMMWu3/sEuQqjNOw0j+v7qXoPhccN9zMNHr3q/ttwpWTL8PooR0YLWPzOgVPk+Xhs3ZdtWJw3xtHRx0WQJjSeRaMf8z0uqcl+kZFBorp9Ce8uiJfYBs5XuBlo97VB8hSFmUvSjcwKdhHxWzLT7E5Xj+wHePftNsmP7f8ySgZ5Tp05T2OHy2nx/11EPjf0rBCrnNUD5rrHdEB9Bn7xMhVsnoKO6CzRwdPSyUchwk5AwM5V/OK1eUifQobCJKuQZdOyBe9JUHYMsf/lJqV5/Uhh5moveQyCCI8P/P+4a6YATo2lnBGSZbGg/5eHsnxdk/g2mIeEwImxzepzh1egTV6D2LMlOhACSU71Fup9q/OB3PemJz8gEGR91BKaoMbb4wIT0/0ZIaupbwlc6W2ZMidtNBu+ddDU14nGb5CwQ2zEIXssCgvgcNmHIBsM4U2oYvM4MtJx7iSnZjdRBtdmCOf8xz7Ly96DN9hR+RmCTldznTRvoamzi7mms3nEWeShYoE4S3Ebmn1LoDpl54p/tBDzPfG1k/yy3BR7JP502xQh2NHe5XeiGH8ey2Qq2R6u+wi1ZGvnbhProknXSAL8qnNK+5Hks36jr1VxHNY1VcYyzRZ9x81ol25G41dHIyVtISwsQDIWW1gLvBTjhIyi+LfblDWZIwDa2XI9hqtcqkNpqwm95rprj4AiOt30xPiGv5FGrvhoXz49f2harhqa04uSwa5YAIDXRKmll/yrrkfFR4QDejp1EPX02clG7S/svlkffbIghsNdL+/H4WoNbZGu2QCWfO8UEPCqTColCiFrZ4O/9s+UquOQl/ttDoU5Utqc9Ms2JmPbVhIPDDnqli/xRxK3XrYKHIp8Di6zLA+g8ovoHqe/9cS2v8JkwAoEmDtY0P4u5d4N6cueU9NZu1Bp0EJPwhtVYc2NDzfCtluXuf8ExpewqPKKXUQwqEoHFUD8+ZM9MSijAGKUyL+ab648CD+Takh1T7f0MSJc+GaQcr1Oxj2HtZ+5s5Kzcuz2NMnjLg/rQs703j0MMpvtZGguRZfT7h7TdRVqlHbbFCJ6TVVtDqs+gpyV3vj5QJNjyqsaGPGj2EVux+byzL6pYsOa3sk64FXzZi0Pk/gTcaO7z25a2stClNOB6t+GoDDJXLxHygkB+20wjxSmfDYx0SpJwkLKuZFsTlSvkXWgf8ojzduQFjWZLWbWsaEX68jr2qPWaeDo4PQ5W75Xc8En5syOgj1V4AUoiBv+4j3aqWa3cAv1nNFlp8P2a6gbUPD3fP1BNRlDaDOdQfAv29wnw5DAHpSqtEJSiFdLgOzRvcEFK2almFuYC98LShBoY56Ssaoz6dEVvz2Z/N069fto3JE0+twNACU4RVE0q934RHVJBhmGWHAsbhYiapQqCfPkrw/GPIHLtl9vK2oWX8ax5092XtBHK8xF1+gEuMbn2v/CQPh7n6KH1OsTnNk9gZ5MitNMGa18E3vqWWlK95GbZtOf9K0jdlcEyoUrsW4vK2cwqBrsPHcAFe58vE2e75Lz+7s/m/pdGArCxZYX0ZGBVHlAAkAT8aDQRHxkW4dFP46MlUEOuu0a6rDbGGS7bmMLKmJlbbu18Q0l3RSv5hvZDKW5LS/8U0KlWZPWi8dFS/Fl8kz2mncxP/w+NeXGW3WPykI2/9gjAUSrLXmyjXGVWPzaP3kKBMzNo9wYcTJNhrs4tRAvwlOJqxPj/+/Oxh0Fwtkdc6+R+xaFRJeA4lv8KnTaVsgIq5e8DTvPjMMWu3/sEuQqjNOw0j+v7qXoPhccN9zMNHr3q/ttwpWTL8PooR0YLWPzOgVPk+Xhs3ZdtWJw3xtHRx0WQJjSeRaMf8z0uqcl+kZFBorp9Ce8uiJfYBs5XuBlo97VB8hSFmUvSjcwKdhHxWzLT7E5Xj+wHePftNsmP7f8ySgZ5Tp05T2OHy2nx/11EPjf0rBCrnNUD5rrHdEB9Bn7xMhVsnoKO6CzRwdPSyUchwk5AwM5V/OK1eUifQobCJKuQZdOyBe9JUHYMsf/lJqV5/Uhh5moveQyCCI8P/P+4a6YATo2lnBGSZbGg/5eHsnxdk/g2mIeEwImxzepzh1egTV6D2LMlOhACSU71Fup9q/OB3PemJz8gEGR91BKaoMbb4wIT0/0ZIaupbwlc6W2ZMidtNBu+ddDU14nGb5CwQ2zEIXssCgvgcNmHIBsM4U2oYvM4MtJx7iSnZjdRBtdmCOf8xz7Ly96DN9hR+RmCTldznTRvoamzi7mms3nEWeShYoE4S3Ebmn1LoDpl54p/tBDzPfG1k/yy3BR7JP502xQh2NHe5XeiGH8ey2Qq2R6u+wi1ZGvnbhProknXSAL8qnNK+5Hks36jr1VxHNY1VcYyzRZ9x81ol25G41dHIyVtISwsQDIWW1gLvBTjhIyi+LfblDWZIwDa2XI9hqtcqkNpqwm95rprj4AiOt30xPiGv5FGrvhoXz49f2harhqa04uSwa5YAIDXRKmll/yrrkfFR4QDejp1EPX02clG7S/svlkffbIghsNdL+/H4WoNbZGu2QCWfO8UEPCqTColCiFrZ4O/9s+UquOQl/ttDoU5Utqc9Ms2JmPbVhIPDDnqli/xRxK3XrYKHIp8Di6zLA+g8ovoHqe/9cS2v8JkwAoEmDtY0P4u5d4N6cueU9NZu1Bp0EJPwhtVYc2NDzfCtluXuf8ExpewqPKKXUQwqEoHFUD8+ZM9MSijAGKUyL+ab648CD+Takh1T7f0MSJc+GaQcr1Oxj2HtZ+5s5Kzcuz2NMnjLg/rQs703j0MMpvtZGguRZfT7h7TdRVqlHbbFCJ6TVVtDqs+gpyV3vj5QJNjyqsaGPGj2EVux+byzL6pYsOa3sk64FXzZi0Pk/gTcaO7z25a2stClNOB6t+GoDDJXLxHygkB+20wjxSmfDYx0SpJwkLKuZFsTlSvkXWgf8ojzduQFjWZLWbWsaEX68jr2qPWaeDo4PQ5W75Xc8En5syOgj1V4AUoiBv+4j3aqWa3cAv1nNFlp8P2a6gbUPD3fP1BNRlDaDOdQfAv29wnw5DAHpSqtEJSiFdLgOzRvcEFK2almFuYC98LShBoY56Ssaoz6dEVvz2Z/N069fto3JE0+twNACU4RVE0q934RHVJBhmGWHAsbhYiapQqCfPkrw/GPIHLtl9vK2oWX8ax5092XtBHK8xF1+gEuMbn2v/CQPh7n6KH1OsTnNk9gZ5MitNMGa18E3vqWWlK95GbZtOf9K0jdlcEyoUrsW4vK2cwqBrsPHcAFe58vE2e75Lz+7s/m/pdGArCxZYX0ZGBVHlAAkAT8aDQRHxkW4dFP46MlUEOuu0a6rDbGGS7bmMLKmJlbbu18Q0l3RSv5hvZDKW5LS/8U0KlWZPWi8dFS/Fl8kz2mncxP/w+NeXGW3WPykI2/9gjAUSrLXmyjXGVWPzaP3kKBMzNo9wYcTJNhrs4tRAvwlOJqxPj/+/Oxh0Fwtkdc6+R+xaFRJeA4lv8KnTaVsgIq5e8DTvPjMMWu3/sEuQqjNOw0j+v7qXoPhccN9zMNHr3q/ttwpWTL8PooR0YLWPzOgVPk+Xhs3ZdtWJw3xtHRx0WQJjSeRaMf8z0uqcl+kZFBorp9Ce8uiJfYBs5XuBlo97VB8hSFmUvSjcwKdhHxWzLT7E5Xj+wHePftNsmP7f8ySgZ5Tp05T2OHy2nx/11EPjf0rBCrnNUD5rrHdEB9Bn7xMhVsnoKO6CzRwdPSyUchwk5AwM5V/OK1eUifQobCJKuQZdOyBe9JUHYMsf/lJqV5/Uhh5moveQyCCI8P/P+4a6YATo2lnBGSZbGg/5eHsnxdk/g2mIeEwImxzepzh1egTV6D2LMlOhACSU71Fup9q/OB3PemJz8gEGR91BKaoMbb4wIT0/0ZIaupbwlc6W2ZMidtNBu+ddDU14nGb5CwQ2zEIXssCgvgcNmHIBsM4U2oYvM4MtJx7iSnZjdRBtdmCOf8xz7Ly96DN9hR+RmCTldznTRvoamzi7mms3nEWeShYoE4S3Ebmn1LoDpl54p/tBDzPfG1k/yy3BR7JP502xQh2NHe5XeiGH8ey2Qq2R6u+wi1ZGvnbhProknXSAL8qnNK+5Hks36jr1VxHNY1VcYyzRZ9x81ol25G41dHIyVtISwsQDIWW1gLvBTjhIyi+LfblDWZIwDa2XI9hqtcqkNpqwm95rprj4AiOt30xPiGv5FGrvhoXz49f2harhqa04uSwa5YAIDXRKmll/yrrkfFR4QDejp1EPX02clG7S/svlkffbIghsNdL+/H4WoNbZGu2QCWfO8UEPCqTColCiFrZ4O/9s+UquOQl/ttDoU5Utqc9Ms2JmPbVhIPDDnqli/xRxK3XrYKHIp8Di6zLA+g8ovoHqe/9cS2v8JkwAoEmDtY0P4u5d4N6cueU9NZu1Bp0EJPwhtVYc2NDzfCtluXuf8ExpewqPKKXUQwqEoHFUD8+ZM9MSijAGKUyL+ab648CD+Takh1T7f0MSJc+GaQcr1Oxj2HtZ+5s5Kzcuz2NMnjLg/rQs703j0MMpvtZGguRZfT7h7TdRVqlHbbFCJ6TVVtDqs+gpyV3vj5QJNjyqsaGPGj2EVux+byzL6pYsOa3sk64FXzZi0Pk/gTcaO7z25a2stClNOB6t+GoDDJXLxHygkB+20wjxSmfDYx0SpJwkLKuZFsTlSvkXWgf8ojzduQFjWZLWbWsaEX68jr2qPWaeDo4PQ5W75Xc8En5syOgj1V4AUoiBv+4j3aqWa3cAv1nNFlp8P2a6gbUPD3fP1BNRlDaDOdQfAv29wnw5DAHpSqtEJSiFdLgOzRvcEFK2almFuYC98LShBoY56Ssaoz6dEVvz2Z/N069fto3JE0+twNACU4RVE0q934RHVJBhmGWHAsbhYiapQqCfPkrw/GPIHLtl9vK2oWX8ax5092XtBHK8xF1+gEuMbn2v/CQPh7n6KH1OsTnNk9gZ5MitNMGa18E3vqWWlK95GbZtOf9K0jdlcEyoUrsW4vK2cwqBrsPHcAFe58vE2e75Lz+7s/m/pdGArCxZYX0ZGBVHlAAkAT8aDQRHxkW4dFP46MlUEOuu0a6rDbGGS7bmMLKmJlbbu18Q0l3RSv5hvZDKW5LS/8U0KlWZPWi8dFS/Fl8kz2mncxP/w+NeXGW3WPykI2/9gjAUSrLXmyjXGVWPzaP3kKBMzNo9wYcTJNhrs4tRAvwlOJqxPj/+/Oxh0Fwtkdc6+R+xaFRJeA4lv8KnTaVsgIq5e8DTvPjMMWu3/sEuQqjNOw0j+v7qXoPhccN9zMNHr3q/ttwpWTL8PooR0YLWPzOgVPk+Xhs3ZdtWJw3xtHRx0WQJjSeRaMf8z0uqcl+kZFBorp9Ce8uiJfYBs5XuBlo97VB8hSFmUvSjcwKdhHxWzLT7E5Xj+wHePftNsmP7f8ySgZ5Tp05T2OHy2nx/11EPjf0rBCrnNUD5rrHdEB9Bn7xMhVsnoKO6CzRwdPSyUchwk5AwM5V/OK1eUifQobCJKuQZdOyBe9JUHYMsf/lJqV5/Uhh5moveQyCCI8P/P+4a6YATo2lnBGSZbGg/5eHsnxdk/g2mIeEwImxzepzh1egTV6D2LMlOhACSU71Fup9q/OB3PemJz8gEGR91BKaoMbb4wIT0/0ZIaupbwlc6W2ZMidtNBu+ddDU14nGb5CwQ2zEIXssCgvgcNmHIBsM4U2oYvM4MtJx7iSnZjdRBtdmCOf8xz7Ly96DN9hR+RmCTldznTRvoamzi7mms3nEWeShYoE4S3Ebmn1LoDpl54p/tBDzPfG1k/yy3BR7JP502xQh2NHe5XeiGH8ey2Qq2R6u+wi1ZGvnbhProknXSAL8qnNK+5Hks36jr1VxHNY1VcYyzRZ9x81ol25G41dHIyVtISwsQDIWW1gLvBTjhIyi+LfblDWZIwDa2XI9hqtcqkNpqwm95rprj4AiOt30xPiGv5FGrvhoXz49f2harhqa04uSwa5YAIDXRKmll/yrrkfFR4QDejp1EPX02clG7S/svlkffbIghsNdL+/H4WoNbZGu2QCWfO8UEPCqTColCiFrZ4O/9s+UquOQl/ttDoU5Utqc9Ms2JmPbVhIPDDnqli/xRxK3XrYKHIp8Di6zLA+g8ovoHqe/9cS2v8JkwAoEmDtY0P4u5d4N6cueU9NZu1Bp0EJPwhtVYc2NDzfCtluXuf8ExpewqPKKXUQwqEoHFUD8+ZM9MSijAGKUyL+ab648CD+Takh1T7f0MSJc+GaQcr1Oxj2HtZ+5s5Kzcuz2NMnjLg/rQs703j0MMpvtZGguRZfT7h7TdRVqlHbbFCJ6TVVtDqs+gpyV3vj5QJNjyqsaGPGj2EVux+byzL6pYsOa3sk64FXzZi0Pk/gTcaO7z25a2stClNOB6t+GoDDJXLxHygkB+20wjxSmfDYx0SpJwkLKuZFsTlSvkXWgf8ojzduQFjWZLWbWsaEX68jr2qPWaeDo4PQ5W75Xc8En5syOgj1V4AUoiBv+4j3aqWa3cAv1nNFlp8P2a6gbUPD3fP1BNRlDaDOdQfAv29wnw5DAHpSqtEJSiFdLgOzRvcEFK2almFuYC98LShBoY56Ssaoz6dEVvz2Z/Nu00003C6vNCF7+ReI8z4bGHdtzstXmuRxDE3vGIMLpx1fmChdWd4vFZuXZg/FH61mMuPEVDxXeVmLbAblTlQwlmQ2l68p2LH+8ETErAMdP1CJ3T6rU5tfeuP4P9E+0BNMl3Kk+UZfeRRIDiCJ0a9pEQS/PneqZuhoX3TeysGf8a6I/3bWT+mPSkHU0Z+n34Uazr8Mi6+5KSn5isls6trhoGS+J1KaxLJC/zz1t0SUZb5ezsAVaMCzPPlOZ1fgySFu3ngqjgw60wm0apaV+ugC3H/8UxBIOzf/wjWL83TmGAeOPRfsGEtmD+pFV6NwQoTHHijSBWS4yM1yS/4X6yeMXFVDRmJXyyWpfY4jBLOL9LWWkeqXhjD54mpUnzf43Z069N0KRZc3zUvYwO75MrSQHoDVPGdnrJwTKKTz4nNmvK2uvny9lf4Yux0u00V8OQDyo1Uf7c810VHS241tXu5+IZoTazCf4Ahw+LRVAXhBXVPPpJi36wmp8ULXWkTm/eFjlZQBP+D4UfJjYcyxfLjrw6GbXrMSY/gBwuRu8MbLlb2ys1kJz8q8qkk67iyp6CYG0cvIV3Qsi5xvEOwiqWgRQ+19WVKdLEymTY74+xU75hv0iw32HpoIB01fO7vwn8igvIDJsSGqiuCMVaQTiAwVGPEx4Aju9dSXNZhmDCPCpp8I06GhRxstqVO4eyc0h2fJkwczwqLOj38HgpdFncwI8PZVT0n/qvHkWzGwhihygEyLCyYbVHvWhYh0BOX8Xn6snAvspEGPfm7JyuzP27WdIP4NmO5l9ajaQ5iRh60RxTvaUhaQPOTossfwbcw4xcjdBauuESkqmhabgl1KVlS2fdEpAzUk4W8vrbC/+b+HboDuf9nC/Qp0M2XEsRbOLoDQCUqHxHAwtauAGnLiOc1aYDri12GdZrBB+vvczfjsLCwRI9Qn1g0oYvTgcGpHe+60zv7qhyTFAnYAAV9Qypdf2IpJqS5aPdZiTZdาก';

export default function QuotationPaper({
  profile,
  customer,
  items,
  docNo,
  docDate,
  validUntil,
  refNo,
  discount,
  discountType,
  vatEnabled,
  vatRate,
  notes,
  paymentTerms,
  bank,
  signeeName,
  signeePosition,
  template,
}: QuotationPaperProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Financial Calculations
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discountAmount =
    discountType === 'percent'
      ? (subtotal * discount) / 100
      : discount;
  const net = Math.max(0, subtotal - discountAmount);
  const vat = vatEnabled ? (net * vatRate) / 100 : 0;
  const total = net + vat;

  // Render PromptPay QR code asynchronously when inputs change
  useEffect(() => {
    async function updateQrCode() {
      if (bank.qrValue) {
        if (bank.qrType === 'promptpay') {
          const payload = generatePromptPayPayload(bank.qrValue, total);
          if (payload) {
            const url = await generateQrDataUrl(payload, 150);
            setQrCodeUrl(url);
            return;
          }
        } else if (bank.qrType === 'line' || bank.qrType === 'text') {
          const url = await generateQrDataUrl(bank.qrValue, 150);
          setQrCodeUrl(url);
          return;
        }
      }
      setQrCodeUrl('');
    }
    updateQrCode();
  }, [bank.qrValue, bank.qrType, total]);

  const money = (num: number) =>
    num.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const isDark = template === 'luxury' || template === 'dark';
  const logoSrc = profile.customLogo || DEFAULT_LOGO;

  return (
    <div
      id="quotation-paper"
      className={`w-[210mm] min-h-[297mm] p-[12mm] shadow-2xl transition-all duration-300 flex flex-col justify-between font-sans leading-relaxed text-sm ${
        isDark
          ? 'bg-zinc-950 text-slate-100 border border-amber-500/20'
          : 'bg-white text-slate-800'
      }`}
      style={{ boxSizing: 'border-box' }}
    >
      <div>
        {/* ================= HEADER SECTION ================= */}
        {template === 'classic' && (
          <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-slate-900">
            <div className="flex gap-4">
              <img src={logoSrc} className="w-14 h-14 object-contain rounded-lg shrink-0" alt="Logo" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">{profile.slogan}</p>
                <p className="text-[10px] text-slate-500 max-w-sm leading-tight">{profile.address}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h1 className="text-xl font-bold text-slate-900 tracking-wide font-title">ใบเสนอราคา</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-0.5">QUOTATION</p>
            </div>
          </div>
        )}

        {template === 'luxury' && (
          <div className="flex justify-between items-start pb-4 mb-4 border-b border-amber-500/20">
            <div className="flex gap-4">
              <img src={logoSrc} className="w-14 h-14 object-contain rounded-lg shrink-0 border border-amber-500/30" alt="Logo" />
              <div>
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-100">{profile.name}</h2>
                <p className="text-[10px] text-amber-500/80 mt-0.5 tracking-wide">{profile.slogan}</p>
                <p className="text-[10px] text-slate-400 max-w-sm leading-tight">{profile.address}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h1 className="text-xl font-bold text-amber-400 tracking-[0.2em] font-title">QUOTATION</h1>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">ใบเสนอราคา</p>
            </div>
          </div>
        )}

        {template === 'dark' && (
          <div className="flex justify-between items-center bg-zinc-900 -mx-[12mm] -mt-[12mm] mb-5 p-5 border-b border-amber-500/30">
            <div className="flex gap-4 items-center">
              <img src={logoSrc} className="w-12 h-12 object-contain rounded-lg shrink-0" alt="Logo" />
              <div>
                <h2 className="text-base font-bold text-amber-400">{profile.name}</h2>
                <p className="text-[9px] text-slate-400">{profile.slogan}</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-base font-bold text-white tracking-wide font-title">ใบเสนอราคา</h1>
              <p className="text-[9px] text-neutral-500 font-mono">{docNo}</p>
            </div>
          </div>
        )}

        {template === 'elegant' && (
          <div className="flex justify-between items-start pb-4 mb-4 border-b border-amber-200">
            <div className="flex gap-4">
              <img src={logoSrc} className="w-14 h-14 object-contain rounded-lg shrink-0" alt="Logo" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
                <p className="text-[10px] text-amber-700 font-semibold">{profile.slogan}</p>
                <p className="text-[10px] text-slate-500 max-w-sm leading-tight">{profile.address}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900 tracking-wider font-title">ใบเสนอราคา</h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-widest mt-0.5">QUOTATION</p>
            </div>
          </div>
        )}

        {template === 'thai-navy' && (
          <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-slate-900">
            <div className="flex gap-4">
              <img src={logoSrc} className="w-14 h-14 object-contain rounded-lg shrink-0 border border-slate-200" alt="Logo" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
                <p className="text-[10px] text-blue-700 font-bold mt-0.5">{profile.slogan}</p>
                <p className="text-[10px] text-slate-500 max-w-sm leading-tight">{profile.address}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h1 className="text-xl font-bold text-blue-900 tracking-wide font-title">ใบเสนอราคา</h1>
              <p className="text-[10px] text-blue-500 font-mono tracking-widest mt-0.5">QUOTATION</p>
            </div>
          </div>
        )}

        {template === 'thai-emerald' && (
          <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-emerald-800">
            <div className="flex gap-4">
              <img src={logoSrc} className="w-14 h-14 object-contain rounded-lg shrink-0 border border-slate-200" alt="Logo" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
                <p className="text-[10px] text-emerald-700 font-bold mt-0.5">{profile.slogan}</p>
                <p className="text-[10px] text-slate-500 max-w-sm leading-tight">{profile.address}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h1 className="text-xl font-bold text-emerald-800 tracking-wide font-title">ใบเสนอราคา</h1>
              <p className="text-[10px] text-emerald-600 font-mono tracking-widest mt-0.5">QUOTATION</p>
            </div>
          </div>
        )}

        {template === 'thai-crimson' && (
          <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-red-700">
            <div className="flex gap-4">
              <img src={logoSrc} className="w-14 h-14 object-contain rounded-lg shrink-0 border border-slate-200" alt="Logo" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
                <p className="text-[10px] text-red-600 font-bold mt-0.5">{profile.slogan}</p>
                <p className="text-[10px] text-slate-500 max-w-sm leading-tight">{profile.address}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h1 className="text-xl font-bold text-red-700 tracking-wide font-title">ใบเสนอราคา</h1>
              <p className="text-[10px] text-red-500 font-mono tracking-widest mt-0.5">QUOTATION</p>
            </div>
          </div>
        )}

        {template === 'thai-teal' && (
          <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-teal-700">
            <div className="flex gap-4">
              <img src={logoSrc} className="w-14 h-14 object-contain rounded-lg shrink-0 border border-slate-200" alt="Logo" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
                <p className="text-[10px] text-teal-700 font-bold mt-0.5">{profile.slogan}</p>
                <p className="text-[10px] text-slate-500 max-w-sm leading-tight">{profile.address}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h1 className="text-xl font-bold text-teal-700 tracking-wide font-title">ใบเสนอราคา</h1>
              <p className="text-[10px] text-teal-600 font-mono tracking-widest mt-0.5">QUOTATION</p>
            </div>
          </div>
        )}

        {template === 'thai-charcoal' && (
          <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-zinc-700">
            <div className="flex gap-4">
              <img src={logoSrc} className="w-14 h-14 object-contain rounded-lg shrink-0 border border-slate-200" alt="Logo" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
                <p className="text-[10px] text-zinc-700 font-bold mt-0.5">{profile.slogan}</p>
                <p className="text-[10px] text-slate-500 max-w-sm leading-tight">{profile.address}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <h1 className="text-xl font-bold text-zinc-800 tracking-wide font-title">ใบเสนอราคา</h1>
              <p className="text-[10px] text-zinc-600 font-mono tracking-widest mt-0.5">QUOTATION</p>
            </div>
          </div>
        )}

        {/* ================= METADATA & CONTACTS ================= */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={`border rounded-xl p-3 ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-150'}`}>
            <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-amber-400' : 'text-slate-500'}`}>
              ลูกค้า / Customer
            </span>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{customer.name || '-'}</div>
            <div className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-xs">{customer.address || ''}</div>
            {customer.phone && <div className="text-[10px] text-slate-400">โทร: {customer.phone}</div>}
          </div>

          <div className={`border rounded-xl p-3 font-mono text-[10px] space-y-1.5 ${isDark ? 'bg-zinc-900/60 border-zinc-800 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-600'}`}>
            <div className="flex justify-between">
              <span>เลขที่เอกสาร / No.</span>
              <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-slate-900'}`}>{docNo}</span>
            </div>
            <div className="flex justify-between">
              <span>วันที่ / Date</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{docDate}</span>
            </div>
            <div className="flex justify-between">
              <span>ยืนราคาถึง / Valid Until</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{validUntil}</span>
            </div>
            {refNo && (
              <div className="flex justify-between">
                <span>อ้างอิง / Ref.</span>
                <span>{refNo}</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= LINE ITEMS TABLE ================= */}
        <div className="overflow-hidden rounded-xl border border-zinc-200/10 mb-4">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className={`text-[10px] font-bold font-title uppercase border-b ${
                template === 'luxury'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 border-amber-600'
                  : template === 'classic'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : template === 'dark'
                  ? 'border-b-2 border-amber-500 text-amber-400 bg-zinc-900'
                  : template === 'thai-navy'
                  ? 'bg-blue-900 text-white border-blue-950'
                  : template === 'thai-emerald'
                  ? 'bg-emerald-800 text-white border-emerald-900'
                  : template === 'thai-crimson'
                  ? 'bg-red-700 text-white border-red-800'
                  : template === 'thai-teal'
                  ? 'bg-teal-700 text-white border-teal-850'
                  : template === 'thai-charcoal'
                  ? 'bg-zinc-800 text-white border-zinc-900'
                  : 'bg-amber-50 text-amber-950 border-amber-200'
              }`}>
                <th className="p-2 text-center w-[7%]">#</th>
                <th className="p-2 w-[51%]">รายการ / Description</th>
                <th className="p-2 text-center w-[10%]">จำนวน</th>
                <th className="p-2 text-center w-[8%]">หน่วย</th>
                <th className="p-2 text-right w-[12%]">ราคา</th>
                <th className="p-2 text-right w-[12%]">รวมเงิน</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr
                  key={it.id}
                  className={`border-b text-[11px] leading-snug align-top ${
                    isDark
                      ? 'border-zinc-900 hover:bg-zinc-900/20 text-slate-300'
                      : 'border-slate-100 hover:bg-slate-50/50 text-slate-800'
                  }`}
                >
                  <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                  <td className="p-2">
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{it.desc}</div>
                    {it.detail && (
                      <div className="text-[9px] text-slate-400 mt-0.5 leading-tight whitespace-pre-line">{it.detail}</div>
                    )}
                  </td>
                  <td className="p-2 text-center">{it.qty}</td>
                  <td className="p-2 text-center">{it.unit}</td>
                  <td className="p-2 text-right font-mono">{money(it.price)}</td>
                  <td className={`p-2 text-right font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {money(it.qty * it.price)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs italic">
                    ไม่มีรายการสินค้า/บริการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= BOTTOM METRICS & DISCLOSURES ================= */}
      <div className="space-y-4">
        <div className="flex justify-between gap-4">
          {/* Notes & Bank details */}
          <div className="w-3/5 space-y-3">
            {notes.length > 0 && (
              <div className={`border rounded-xl p-2.5 text-[10px] leading-relaxed ${
                isDark ? 'bg-zinc-900/40 border-zinc-900 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
              }`}>
                <div className={`font-bold mb-1 font-title ${isDark ? 'text-amber-400' : 'text-slate-800'}`}>
                  📝 หมายเหตุ / Notes
                </div>
                <div className="space-y-0.5">
                  {notes.map((note, nIdx) => (
                    <div key={nIdx} className="flex gap-1.5">
                      <span className="shrink-0">{nIdx + 1}.</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paymentTerms && (
              <div className={`border rounded-xl p-2 text-[9px] leading-relaxed ${
                isDark ? 'bg-zinc-900/40 border-zinc-900 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
              }`}>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">เงื่อนไขการชำระเงิน</span>
                <span className="whitespace-pre-line">{paymentTerms}</span>
              </div>
            )}
          </div>

          {/* Pricing totals */}
          <div className="w-2/5 space-y-1.5 font-mono text-[11px] text-right">
            <div className="flex justify-between text-slate-400">
              <span>รวมเป็นเงิน</span>
              <span className={isDark ? 'text-white' : 'text-slate-900'}>{money(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>ส่วนลด {discountType === 'percent' ? `(${discount}%)` : ''}</span>
                <span>-{money(discountAmount)}</span>
              </div>
            )}
            {vatEnabled && (
              <div className="flex justify-between text-slate-400">
                <span>ภาษีมูลค่าเพิ่ม ({vatRate}%)</span>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>{money(vat)}</span>
              </div>
            )}
            
            <div className={`flex justify-between p-2.5 rounded-lg font-bold font-title text-xs mt-2 ${
              template === 'luxury'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950'
                : template === 'classic'
                ? 'bg-slate-950 text-white'
                : template === 'dark'
                ? 'bg-amber-500 text-slate-950 border-b-2 border-amber-600'
                : template === 'thai-navy'
                ? 'bg-blue-900 text-white'
                : template === 'thai-emerald'
                ? 'bg-emerald-800 text-white'
                : template === 'thai-crimson'
                ? 'bg-red-700 text-white'
                : template === 'thai-teal'
                ? 'bg-teal-700 text-white'
                : template === 'thai-charcoal'
                ? 'bg-zinc-800 text-white'
                : 'bg-amber-900 text-white'
            }`}>
              <span>ยอดรวมทั้งสิ้น / Total</span>
              <span className="text-sm">{money(total)} บาท</span>
            </div>
          </div>
        </div>

        {/* ================= PAYMENT TARGET & SIGNATURE ================= */}
        <div className={`flex justify-between items-end gap-4 pt-3 border-t ${isDark ? 'border-zinc-900' : 'border-slate-100'}`}>
          <div className="w-3/5">
            <div className="flex items-center gap-3">
              {bank.customQr ? (
                <div className={`p-1.5 rounded-lg bg-white shadow-md border ${isDark ? 'border-zinc-800' : 'border-slate-150'}`}>
                  <img src={bank.customQr} className="w-16 h-16 object-contain" alt="QR PAY" />
                </div>
              ) : qrCodeUrl ? (
                <div className={`p-1.5 rounded-lg bg-white shadow-md border ${isDark ? 'border-zinc-800' : 'border-slate-150'}`}>
                  <img src={qrCodeUrl} className="w-16 h-16 object-contain" alt="Payment QR" />
                </div>
              ) : null}
              <div className="text-[10px] leading-relaxed">
                <div className={`font-bold ${isDark ? 'text-amber-400' : 'text-slate-800'}`}>
                  🖼️ QR PAY / Payment Channel
                </div>
                {bank.name && <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>{bank.name}</div>}
                <div className="text-slate-400">ชื่อบัญชี: <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{bank.owner}</span></div>
                <div className="text-[9px] font-semibold text-amber-500 mt-0.5">
                  {bank.customQr ? 'สแกนคิวอาร์โค้ดเพื่อสแกนจ่ายเงิน' : bank.qrValue ? 'สแกนเพื่อจ่ายเงิน' : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="w-2/5 text-center">
            <div className="text-[10px] text-slate-400 mb-8">ขอแสดงความนับถือ / Sincerely</div>
            <div className="border-t border-slate-300 dark:border-zinc-800 pt-1 text-xs">
              <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>( {signeeName} )</div>
              <div className="text-slate-400 text-[10px]">{signeePosition}</div>
            </div>
          </div>
        </div>

        {/* ================= FOOTER META ================= */}
        <div className={`border-t pt-2 flex justify-between text-[9px] text-slate-400 ${isDark ? 'border-zinc-900' : 'border-slate-100'}`}>
          <span>โทร: {profile.phone || '-'}</span>
          <span>อีเมล: {profile.email || '-'}</span>
          <span>เว็บไซต์: {profile.website || '-'}</span>
          <span>LINE: {profile.line || '-'}</span>
        </div>
      </div>
    </div>
  );
}
