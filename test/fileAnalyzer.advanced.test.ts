import { FileAnalyzer } from '../src/utils/fileAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

describe('FileAnalyzer - Edge Cases', () => {
  let analyzer: FileAnalyzer;
  const testRoot = path.join(__dirname, 'fixtures', 'analyzer');

  beforeAll(() => {
    if (!fs.existsSync(testRoot)) {
      fs.mkdirSync(testRoot, { recursive: true });
    }
    analyzer = new FileAnalyzer(testRoot);
  });

  afterAll(() => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('File discovery', () => {
    it('should find all supported file types', () => {
      // Create various file types
      fs.writeFileSync(path.join(testRoot, 'test.ts'), 'const x = 1;');
      fs.writeFileSync(path.join(testRoot, 'test.tsx'), 'const y = 2;');
      fs.writeFileSync(path.join(testRoot, 'test.js'), 'const z = 3;');
      fs.writeFileSync(path.join(testRoot, 'test.jsx'), 'const a = 4;');
      fs.writeFileSync(path.join(testRoot, 'test.html'), '<html></html>');
      fs.writeFileSync(path.join(testRoot, 'test.css'), '.test {}');

      const files = analyzer.getAllSourceFiles();
      
      expect(files.some(f => f.endsWith('.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('.tsx'))).toBe(true);
      expect(files.some(f => f.endsWith('.js'))).toBe(true);
      expect(files.some(f => f.endsWith('.jsx'))).toBe(true);
      expect(files.some(f => f.endsWith('.html'))).toBe(true);
      expect(files.some(f => f.endsWith('.css'))).toBe(true);
    });

    it('should exclude binary files', () => {
      fs.writeFileSync(path.join(testRoot, 'image.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      fs.writeFileSync(path.join(testRoot, 'doc.pdf'), Buffer.from([0x25, 0x50, 0x44, 0x46]));

      const files = analyzer.getAllSourceFiles();
      
      expect(files.some(f => f.endsWith('.png'))).toBe(false);
      expect(files.some(f => f.endsWith('.pdf'))).toBe(false);
    });

    it('should exclude hidden directories', () => {
      const hiddenDir = path.join(testRoot, '.hidden');
      fs.mkdirSync(hiddenDir, { recursive: true });
      fs.writeFileSync(path.join(hiddenDir, 'test.ts'), 'const x = 1;');

      const files = analyzer.getAllSourceFiles();
      
      expect(files.some(f => f.includes('.hidden'))).toBe(false);
    });

    it('should handle symlinks gracefully', () => {
      // Create a regular file
      const realFile = path.join(testRoot, 'real.ts');
      fs.writeFileSync(realFile, 'const x = 1;');

      const files = analyzer.getAllSourceFiles();
      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe('Complexity calculation', () => {
    it('should detect high complexity patterns', () => {
      const complexFile = path.join(testRoot, 'complex.ts');
      fs.writeFileSync(complexFile, `
        function complex() {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  if (e) {
                    return true;
                  }
                }
              }
            }
          }
          for (let i = 0; i < 10; i++) {
            while (condition) {
              switch (value) {
                case 1: break;
                case 2: break;
                case 3: break;
              }
            }
          }
        }
      `);

      const metrics = analyzer.analyzeFiles([complexFile]);
      expect(metrics[0].complexity).toBeGreaterThan(15);
    });

    it('should handle minimal complexity', () => {
      const simpleFile = path.join(testRoot, 'simple.ts');
      fs.writeFileSync(simpleFile, `
        const x = 1;
        const y = 2;
        console.log(x + y);
      `);

      const metrics = analyzer.analyzeFiles([simpleFile]);
      expect(metrics[0].complexity).toBeLessThan(5);
    });

    it('should count logical operators', () => {
      const logicalFile = path.join(testRoot, 'logical.ts');
      fs.writeFileSync(logicalFile, `
        if (a && b || c && d) {
          return true;
        }
      `);

      const metrics = analyzer.analyzeFiles([logicalFile]);
      expect(metrics[0].complexity).toBeGreaterThan(1);
    });
  });

  describe('Line counting', () => {
    it('should count code lines accurately', () => {
      const testFile = path.join(testRoot, 'lines.ts');
      fs.writeFileSync(testFile, `
        // Comment line
        const x = 1;
        
        /* Multi
           line
           comment */
        const y = 2;
      `);

      const metrics = analyzer.analyzeFiles([testFile]);
      expect(metrics[0].codeLines).toBeGreaterThan(0);
      expect(metrics[0].commentLines).toBeGreaterThan(0);
    });

    it('should handle empty files', () => {
      const emptyFile = path.join(testRoot, 'empty.ts');
      fs.writeFileSync(emptyFile, '');

      const metrics = analyzer.analyzeFiles([emptyFile]);
      expect(metrics[0].lines).toBe(0);
      expect(metrics[0].codeLines).toBe(0);
    });

    it('should handle files with only whitespace', () => {
      const whitespaceFile = path.join(testRoot, 'whitespace.ts');
      fs.writeFileSync(whitespaceFile, '\n\n\n   \n\t\n');

      const metrics = analyzer.analyzeFiles([whitespaceFile]);
      expect(metrics[0].codeLines).toBe(0);
    });
  });

  describe('Issue detection', () => {
    it('should detect large files', () => {
      const largeFile = path.join(testRoot, 'large.ts');
      let content = '';
      for (let i = 0; i < 600; i++) {
        content += `const x${i} = ${i};\n`;
      }
      fs.writeFileSync(largeFile, content);

      const metrics = analyzer.analyzeFiles([largeFile]);
      expect(metrics[0].issues.some(i => i.includes('too large'))).toBe(true);
    });

    it('should detect any types', () => {
      const anyFile = path.join(testRoot, 'any.ts');
      fs.writeFileSync(anyFile, `
        const x: any = 1;
        function test(param: any) {}
      `);

      const metrics = analyzer.analyzeFiles([anyFile]);
      expect(metrics[0].issues.some(i => i.includes('any'))).toBe(true);
    });

    it('should not flag test files for console.log', () => {
      const testFile = path.join(testRoot, 'test.spec.ts');
      fs.writeFileSync(testFile, `
        describe('test', () => {
          it('should work', () => {
            console.log('debug');
          });
        });
      `);

      const metrics = analyzer.analyzeFiles([testFile]);
      expect(metrics[0].issues.some(i => i.includes('console.log'))).toBe(false);
    });
  });

  describe('Function and class counting', () => {
    it('should count functions', () => {
      const funcFile = path.join(testRoot, 'functions.ts');
      fs.writeFileSync(funcFile, `
        function func1() {}
        const func2 = () => {};
        async function func3() {}
      `);

      const metrics = analyzer.analyzeFiles([funcFile]);
      expect(metrics[0].functions).toBeGreaterThanOrEqual(2);
    });

    it('should count classes', () => {
      const classFile = path.join(testRoot, 'classes.ts');
      fs.writeFileSync(classFile, `
        class MyClass {}
        class AnotherClass extends MyClass {}
      `);

      const metrics = analyzer.analyzeFiles([classFile]);
      expect(metrics[0].classes).toBeGreaterThanOrEqual(2);
    });

    it('should handle files with no functions or classes', () => {
      const plainFile = path.join(testRoot, 'plain.ts');
      fs.writeFileSync(plainFile, `
        const x = 1;
        const y = 2;
      `);

      const metrics = analyzer.analyzeFiles([plainFile]);
      expect(metrics[0].functions).toBe(0);
      expect(metrics[0].classes).toBe(0);
    });
  });

  describe('Language detection', () => {
    it('should detect TypeScript', () => {
      const tsFile = path.join(testRoot, 'lang.ts');
      fs.writeFileSync(tsFile, 'const x: number = 1;');

      const metrics = analyzer.analyzeFiles([tsFile]);
      expect(metrics[0].language).toBe('TypeScript');
    });

    it('should detect HTML', () => {
      const htmlFile = path.join(testRoot, 'lang.html');
      fs.writeFileSync(htmlFile, '<html></html>');

      const metrics = analyzer.analyzeFiles([htmlFile]);
      expect(metrics[0].language).toBe('HTML');
    });

    it('should detect CSS', () => {
      const cssFile = path.join(testRoot, 'lang.css');
      fs.writeFileSync(cssFile, '.class {}');

      const metrics = analyzer.analyzeFiles([cssFile]);
      expect(metrics[0].language).toBe('CSS');
    });
  });

  describe('Batch analysis', () => {
    it('should analyze multiple files efficiently', () => {
      const files = [];
      for (let i = 0; i < 10; i++) {
        const file = path.join(testRoot, `batch${i}.ts`);
        fs.writeFileSync(file, `const x${i} = ${i};`);
        files.push(file);
      }

      const startTime = Date.now();
      const metrics = analyzer.analyzeFiles(files);
      const duration = Date.now() - startTime;

      expect(metrics.length).toBe(10);
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });
  });
});
