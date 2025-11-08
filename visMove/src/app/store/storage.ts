interface Package {
    id: string,
    name: string,
}
interface DexInfo {
    name: string;
    packages: Package[];
}
export const storage: DexInfo[] = [
    {
        name: 'Centus',
        packages: [
            {
                id: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
                name: 'CLMM',
            },
            {
                id: '0x368d13376443a8051b22b42a9125f6a3bc836422bb2d9c4a53984b8d6624c326',
                name: 'Aggregator V2'
            },
            {
                id: '0x43811be4677f5a5de7bf2dac740c10abddfaa524aee6b18e910eeadda8a2f6ae',
                name: 'Aggregator V1'
            },
        ]
    },
];

// export const findPackage = (pid: string): Package | null => {
//     const packages = storage.find(s => s.name === name && s.packages.map(p => p.id === pid))
//     return packages?.packages[0] || null;
// }