import HTMLInjector from '../../components/HTMLInjector';

export default function TestPage() {
  const html = `<!-- e.g. custom CSS -->
<style> body { background: red; } </style>
<script>alert(1);</script>
<meta name="test" content="123" />`;

  return (
    <div>
      <h1>Test HTMLInjector</h1>
      <div id="test-output">
        <HTMLInjector html={html} />
      </div>
    </div>
  );
}
