//@ts-nocheck
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
const PASSWORD = "$CasaEstate3334"; // change this to your local password

export default function App() {
    const [entered, setEntered] = useState(true);
    const [inputPassword, setInputPassword] = useState("");
    const [jsonData, setJsonData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handlePasswordSubmit = () => {
        if (inputPassword === PASSWORD) {
            setEntered(true);
        } else {
            alert("Wrong password");
        }
    };

    useEffect(() => {
        if (entered) {
            axios.get("https://admin.casaestate.am/api/read").then((res) => {
                setJsonData(res.data);
            });
        }
    }, [entered]);

    const handleJsonChange = (path, newValue) => {
        setJsonData((prev) => {
            const copy = structuredClone(prev);
            let ref = copy;
            for (let i = 0; i < path.length - 1; i++) {
                ref = ref[path[i]];
            }
            ref[path[path.length - 1]] = newValue;
            return copy;
        });
    };

    const handleSave = async () => {
        if (!jsonData) return;
        setSaving(true);
        setSaved(false);
        try {
            await axios.post("https://admin.casaestate.am/api/rewrite", jsonData);
            setSaved(true);
        } catch (err) {
            alert("Failed to save changes");
        } finally {
            setSaving(false);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
            {!entered ? (
                <div className="bg-white p-6 rounded-2xl shadow-md w-80">
                    <h1 className="text-xl font-semibold mb-4 text-center">Enter Password</h1>
                    <input type="password" value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} className="border rounded-lg w-full p-2 mb-4" placeholder="Password" />
                    <button onClick={handlePasswordSubmit} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                        Enter
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-3xl space-y-4">
                    {!jsonData ? (
                        <div className="bg-white p-6 rounded-2xl shadow-md text-center">Loading...</div>
                    ) : (
                        <>
                            <JsonEditor data={jsonData} onChange={handleJsonChange} path={[]} />
                            <div className="flex justify-end">
                                <button onClick={handleSave} disabled={saving} className={`mt-4 px-6 py-2 rounded-lg text-white font-semibold transition ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
                                    {saving ? "Saving..." : saved ? "✅ Saved!" : "💾 Save Changes"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
function JsonEditor({ data, onChange, path }) {
    const handleImageUpload = async (file) => {
        // keep only a-z, A-Z, 0-9 and dot for extension
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, ""); // remove everything else

        if (!sanitizedName) {
            alert("Filename must contain at least one alphanumeric character");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("name", sanitizedName);

        try {
            const res = await axios.post("https://admin.casaestate.am/api/image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onChange(path, res.data.filename); // save filename in JSON
        } catch (err) {
            alert("Image upload failed");
            console.error(err);
        }
    };

    // img field
    if (path[path.length - 1] === "img") {
        return (
            <div className="flex flex-col gap-2 my-1">
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0]);
                        }
                    }}
                    className="border rounded p-1 w-full"
                />
                {typeof data === "string" && data && <span className="text-sm text-gray-600">Uploaded: {data}</span>}
            </div>
        );
    }

    // string
    if (typeof data === "string") {
        return <input type="text" value={data} onChange={(e) => onChange(path, e.target.value)} className="border rounded p-1 w-full my-1" />;
    }

    // array
    if (Array.isArray(data)) {
        return (
            <div className="ml-4 space-y-1">
                {data.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                            {typeof item === "object" && item !== null ? (
                                <JsonEditor data={item} onChange={onChange} path={[...path, index]} />
                            ) : (
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => {
                                        const arr = [...data];
                                        arr[index] = e.target.value;
                                        onChange(path, arr);
                                    }}
                                    className="border rounded p-1 w-full"
                                />
                            )}
                        </div>
                        <button
                            className="text-red-500 mt-1"
                            onClick={() => {
                                const arr = data.filter((_, i) => i !== index);
                                onChange(path, arr);
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <div className="flex gap-2 mt-1">
                    <button onClick={() => onChange(path, [...data, ""])} className="text-blue-600 text-sm">
                        + Add item
                    </button>
                    <button
                        onClick={() => {
                            const newObject = {};
                            Object.keys(data[0]).map((k) => (newObject[k] = ""));
                            onChange(path, [...data, newObject]);
                        }}
                        className="text-green-600 text-sm"
                    >
                        + Add object
                    </button>
                </div>
            </div>
        );
    }

    // object
    if (typeof data === "object" && data !== null) {
        return (
            <div className="space-y-2">
                {Object.entries(data).map(([key, value]) => (
                    <AccordionItem key={key} title={key}>
                        <JsonEditor data={value} onChange={onChange} path={[...path, key]} />
                    </AccordionItem>
                ))}
            </div>
        );
    }

    return <div className="text-gray-400 italic">Unsupported type</div>;
}

function AccordionItem({ title, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <button className="w-full text-left px-4 py-2 font-semibold bg-gray-100 hover:bg-gray-200" onClick={() => setOpen(!open)}>
                {title}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="p-3">
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
