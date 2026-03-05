import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
    Quote, Code, ImageIcon, LinkIcon, Heading1, Heading2, Heading3
} from 'lucide-react';

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt('URL of the image');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = () => {
        const url = window.prompt('URL of the link');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        } else if (url === '') {
            editor.chain().focus().unsetLink().run();
        }
    };

    const btnClass = "p-2 hover:bg-slate-700 rounded transition-colors text-slate-300";
    const activeBtnClass = "p-2 bg-purple-600 rounded text-white transition-colors";

    return (
        <div className="border-b border-slate-700 p-2 flex flex-wrap gap-2 items-center bg-slate-800 rounded-t-lg">
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? activeBtnClass : btnClass}><Heading1 size={18} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? activeBtnClass : btnClass}><Heading2 size={18} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? activeBtnClass : btnClass}><Heading3 size={18} /></button>
            <div className="w-px h-6 bg-slate-600 mx-1"></div>
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? activeBtnClass : btnClass}><Bold size={18} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? activeBtnClass : btnClass}><Italic size={18} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? activeBtnClass : btnClass}><UnderlineIcon size={18} /></button>
            <div className="w-px h-6 bg-slate-600 mx-1"></div>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? activeBtnClass : btnClass}><List size={18} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? activeBtnClass : btnClass}><ListOrdered size={18} /></button>
            <div className="w-px h-6 bg-slate-600 mx-1"></div>
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? activeBtnClass : btnClass}><Quote size={18} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? activeBtnClass : btnClass}><Code size={18} /></button>
            <div className="w-px h-6 bg-slate-600 mx-1"></div>
            <button type="button" onClick={addImage} className={btnClass}><ImageIcon size={18} /></button>
            <button type="button" onClick={setLink} className={editor.isActive('link') ? activeBtnClass : btnClass}><LinkIcon size={18} /></button>
        </div>
    );
};

const RichTextEditor = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Image.configure({
                HTMLAttributes: {
                    class: 'w-full rounded-lg my-4 object-cover',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-400 hover:text-blue-300 underline',
                },
            }),
            Placeholder.configure({
                placeholder: 'Write your article here...',
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none min-h-[400px] p-6 text-slate-200 focus:outline-none rounded-b-lg border border-t-0 border-slate-700 bg-slate-900',
            },
        },
    });

    return (
        <div className="rounded-lg shadow-lg w-full">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default RichTextEditor;
