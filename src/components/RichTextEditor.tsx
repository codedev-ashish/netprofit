"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const joditConfig = useMemo(() => ({
    readonly: false,
    height: 400,
    placeholder: 'Start writing...',
    uploader: {
      insertImageAsBase64URI: true
    },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'align', 'outdent', 'indent', '|',
      'ul', 'ol', '|',
      'eraser', 'copyformat', 'hr', 'symbol', 
      '\n',
      'source', '|',
      'undo', 'redo', '|',
      'link', 'image', 'video', 'file', 'table', '|',
      'find', 'preview', 'print', '|',
      'fullsize', 'about'
    ],
    controls: {
      font: {
        list: {
          'Arial,Helvetica,sans-serif': 'Arial',
          'Georgia,serif': 'Georgia',
          'Impact,Charcoal,sans-serif': 'Impact',
          'Tahoma,Geneva,sans-serif': 'Tahoma',
          'Times New Roman,Times,serif': 'Times New Roman',
          'Verdana,Geneva,sans-serif': 'Verdana',
          'Courier New,Courier,monospace': 'Courier New',
          'Comic Sans MS,Comic Sans,cursive': 'Comic Sans',
          'Trebuchet MS,Helvetica,sans-serif': 'Trebuchet MS',
          'Palatino Linotype,Book Antiqua,Palatino,serif': 'Palatino',
          'Lucida Sans Unicode,Lucida Grande,sans-serif': 'Lucida Sans',
          'Garamond,serif': 'Garamond',
          'Brush Script MT,cursive': 'Brush Script',
          'Calibri,sans-serif': 'Calibri'
        }
      }
    },
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: true,
    resizer: {
      showSize: true
    },
    toolbarAdaptive: true,
    width: '100%',
    style: {
      background: '#ffffff',
      color: '#000000'
    }
  }), []);

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', background: 'white', color: 'black', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', marginBottom: '1rem' }}>
      <JoditEditor 
        value={value}
        config={joditConfig}
        onBlur={(newContent) => onChange(newContent)}
      />
    </div>
  );
}
