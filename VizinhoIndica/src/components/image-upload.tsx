import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string | null;
    file: File | null;
    onFileChange: (file: File | null) => void;
    onRemove?: () => void;
    disabled?: boolean;
    label?: string;
    description?: string;
    maxSizeMb?: number;
    className?: string;
}

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
    value,
    file,
    onFileChange,
    onRemove,
    disabled = false,
    label = "Imagem do anúncio",
    description = "Clique ou arraste uma imagem aqui",
    maxSizeMb = 5,
    className,
}: ImageUploadProps) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const imageUrl = previewUrl || value || null;

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    function resetInput() {
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    function validateAndSetFile(selectedFile: File) {
        if (disabled) return;

        if (!acceptedTypes.includes(selectedFile.type)) {
            toast.error("Envie uma imagem JPG, PNG ou WEBP.");
            resetInput();
            return;
        }

        const maxSizeBytes = maxSizeMb * 1024 * 1024;

        if (selectedFile.size > maxSizeBytes) {
            toast.error(`A imagem deve ter no máximo ${maxSizeMb}MB.`);
            resetInput();
            return;
        }

        onFileChange(selectedFile);
    }

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setIsDragging(false);

        const selectedFile = event.dataTransfer.files?.[0];

        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    }

    function handleRemove() {
        onFileChange(null);
        onRemove?.();
        resetInput();
    }

    return (
        <div className={cn("space-y-2", className)}>
            <p className="text-sm font-medium leading-none">{label}</p>

            <label
                htmlFor={inputId}
                onDragOver={(event) => {
                    event.preventDefault();
                    if (!disabled) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    "group relative flex min-h-55 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:border-primary hover:bg-primary/5",
                    isDragging && "border-primary bg-primary/5",
                    disabled && "cursor-not-allowed opacity-60",
                )}
            >
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt="Prévia da imagem do anúncio"
                            className="h-full max-h-80 min-h-55 w-full object-cover"
                        />

                        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-foreground shadow">
                                Trocar imagem
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center px-6 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {isDragging ? (
                                <UploadCloud className="h-6 w-6" />
                            ) : (
                                <ImagePlus className="h-6 w-6" />
                            )}
                        </div>

                        <p className="text-sm font-medium text-foreground">{description}</p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            JPG, PNG ou WEBP até {maxSizeMb}MB
                        </p>
                    </div>
                )}

                <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={disabled}
                    onChange={(event) => {
                        const selectedFile = event.target.files?.[0];

                        if (selectedFile) {
                            validateAndSetFile(selectedFile);
                        }
                    }}
                    className="sr-only"
                />
            </label>

            {imageUrl && (
                <button
                    type="button"
                    onClick={handleRemove}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline disabled:pointer-events-none disabled:opacity-50"
                >
                    <X className="h-3.5 w-3.5" />
                    Remover imagem
                </button>
            )}
        </div>
    );
}