"use client";

import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '1rem', background: 'var(--bg-secondary)' }}>
      <Editor
        tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
        onInit={(evt, editor) => { editorRef.current = editor; }}
        value={value || ''}
        onEditorChange={(newValue) => onChange(newValue)}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
            'emoticons', 'pagebreak', 'directionality'
          ],
          toolbar: [
            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify',
            'bullist numlist outdent indent | subscript superscript | ltr rtl | table image media link | charmap emoticons | removeformat fullscreen code preview help'
          ],
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px; background-color: #0f172a; color: #f8fafc; } a { color: #3b82f6; }',
          skin: 'oxide-dark',
          content_css: 'dark',
          font_family_formats: 'Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Calibri=calibri,sans-serif; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings,zapf dingbats',
          branding: false,
          promotion: false
        }}
      />
    </div>
  );
}
