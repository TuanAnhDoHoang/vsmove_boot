'use client'
import { useNetwork } from "@/hooks/NetworkContext";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getFullnodeUrl, SuiClient, SuiMoveNormalizedModules } from "@mysten/sui/client";
import { Droplet, Package, Copy, X, Menu, ArrowDown, ArrowRight, Check, Book } from 'lucide-react';
import { useEffect, useState } from "react";
import { storage } from "./storage";


export default function PackageStore() {
    const { currNetwork } = useNetwork();
    const [showSidebar, setShowSidebar] = useState(false);
    const [showDexDetail, setShowDexDetail] = useState<string[]>([]);

    const [ownPackages, setOwnPackages] = useState<string[]>([]);
    const [ownPackageDetail, setOwnPackageDetail] = useState<Map<string, string[]>>(new Map());
    const [showOwnPackageDetail, setShowOwnPackageDetail] = useState<string[]>([]);
    const currAccount = useCurrentAccount();
    const client = new SuiClient({ url: getFullnodeUrl(currNetwork) });

    useEffect(() => {
        const getPackages = async () => {
            if (currAccount) {
                const response = await client.getOwnedObjects({
                    owner: currAccount?.address || '',
                    filter: { StructType: '0x2::package::UpgradeCap' },
                    options: {
                        showContent: true,
                    }
                });
                let temp: string[] = [];
                response.data.map(data => temp.push((data.data?.content as any).fields.package))
                setOwnPackages(temp);


                let package_module = new Map<string, string[]>();
                await Promise.all(
                    temp.map(async (p) => {
                        const m_response: SuiMoveNormalizedModules = await client.getNormalizedMoveModulesByPackage({ package: p });
                        let modules: string[] = [];
                        for (const k of Object.keys(m_response)) {
                            modules.push(k);
                        }
                        package_module.set(p, modules);
                    })
                );
                setOwnPackageDetail(package_module);
            }
        }
        getPackages();
    }, [currAccount, currNetwork]);

    async function copyTextToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            alert('Content copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }
    const show_sidebar = () => {
        setShowSidebar(true)
    }
    const hide_sidebar = () => {
        setShowSidebar(false)
    }
    const show_package = (dex_name: string) => {
        setShowDexDetail([...showDexDetail, dex_name]);
    }
    const hide_package = (dex_name: string) => {
        let dexDetail = showDexDetail.filter(d => d != dex_name);
        setShowDexDetail(dexDetail);
    }
    const toggle_show_detail = (dex_name: string) => {
        if (showDexDetail.includes(dex_name)) {
            hide_package(dex_name);
        }
        else {
            show_package(dex_name);
        }
    }
    const check_show_detail = (dex_name: string) => {
        return showDexDetail.includes(dex_name);
    }
    const show_own_package_detail = (packageid: string) => {
        setShowOwnPackageDetail([...showOwnPackageDetail, packageid]);
    }
    const hide_own_package_detail = (packageid: string) => {
        let temp = showOwnPackageDetail.filter(p => p != packageid);
        setShowOwnPackageDetail(temp);
    }
    const toggle_own_package_detail = (packageid: string) => {
        if (showOwnPackageDetail.includes(packageid)) {
            hide_own_package_detail(packageid);
        }
        else {
            show_own_package_detail(packageid);
        }
    }
    const check_show_own_package_detail = (packageid: string) => {
        return showOwnPackageDetail.includes(packageid);
    }
    const get_own_module_by_package = (packageid: string): string[] => {
        return ownPackageDetail.get(packageid) ?? [];
    }
    return (
        <div className="h-screen mt-10">
            {showSidebar &&
                <div className={`side-bar bg-gray-800 h-[50%] max-w-[300px] w-1/3 pt-10 relative rounded-lg ${showSidebar ? '' : 'hidden'}
                overflow-y-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-blue-700
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-blue-700
                dark:[&::-webkit-scrollbar-track]:bg-neutral-700
                dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500
                `}>
                    {currNetwork === 'mainnet' && storage.map(s => (
                        <div key={s.name} className="object w-full flex flex-col items-center gap-2">
                            <div
                                onClick={() => toggle_show_detail(s.name)}
                                className="dex flex gap-4 w-4/5 hover:cursor-pointer justify-between">
                                <div className="flex gap-4">
                                    <Droplet className="size-6" />
                                    <span>{s.name}</span>
                                </div>
                                {!check_show_detail(s.name) && <ArrowRight />}
                                {check_show_detail(s.name) && <ArrowDown />}
                            </div>
                            {check_show_detail(s.name) && s.packages.map(p => (
                                <div key={p.id} className="package flex gap-4 w-3/5 justify-between my-1">
                                    <div
                                        // onClick={() => showPackage()}
                                        className="flex gap-4 hover:cursor-pointer">
                                        < Package className="size-5" />
                                        <span>{p.name}</span>
                                    </div>
                                    <Copy
                                        className="size-4 hover:cursor-pointer"
                                        onClick={() => copyTextToClipboard(p.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                    {currNetwork === 'testnet' && (
                        <div className="flex flex-col gap-4">
                            {ownPackages.map(p => (
                                <div key={p} className="flex flex-col items-center gap-2">
                                    <div
                                        onClick={() => toggle_own_package_detail(p)}
                                        className="flex gap-2 justify-between w-3/4 hover:cursor-pointer">

                                        <Package />
                                        <div className="">{p.substring(0, 10)}...{p.slice(-2)}</div>
                                        {check_show_own_package_detail(p) && <ArrowDown />}
                                        {!check_show_own_package_detail(p) && <ArrowRight />}
                                        <Copy
                                            className="size-4 hover:cursor-pointer"
                                            onClick={() => copyTextToClipboard(p)}
                                        />

                                    </div>
                                    {check_show_own_package_detail(p) && get_own_module_by_package(p).map(m => (
                                        <div key={m} className="w-1/2 flex gap-2 ">
                                            <Book />
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                    {currNetwork === 'devnet'}
                    <div className="absolute top-0 right-0 m-2">
                        <X onClick={hide_sidebar} className="hover:cursor-pointer" />
                    </div>
                </div>
            }
            {!showSidebar &&
                <div
                    onClick={show_sidebar}
                    className="bg-blue-900 h-20 max-w-[100px] flex items-center justify-end rounded-r-full hover:cursor-pointer">
                    <Menu className="mr-2 size-10" />
                </div>
            }
        </div>
    )
}