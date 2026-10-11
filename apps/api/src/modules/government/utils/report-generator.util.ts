/**
 * Utility for generating formatted reports and exports
 */
export class ReportGeneratorUtil {
  /**
   * Generate CSV from report data
   */
  static generateCsv(data: any[], headers: string[]): string {
    const rows: string[] = [];
    
    // Add header row
    rows.push(headers.join(','));

    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        // Escape commas and quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Generate Excel-compatible CSV with UTF-8 BOM
   */
  static generateExcelCsv(data: any[], headers: string[]): Buffer {
    const csv = this.generateCsv(data, headers);
    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    return Buffer.from(BOM + csv, 'utf8');
  }

  /**
   * Generate HTML table from data
   */
  static generateHtmlTable(data: any[], headers: string[], title?: string): string {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<style>\n';
    html += 'table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }\n';
    html += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n';
    html += 'th { background-color: #4F46E5; color: white; }\n';
    html += 'tr:nth-child(even) { background-color: #f2f2f2; }\n';
    html += 'h1 { color: #333; }\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';

    if (title) {
      html += `<h1>${title}</h1>\n`;
    }

    html += '<table>\n<thead>\n<tr>\n';
    
    // Add headers
    headers.forEach(header => {
      html += `<th>${this.escapeHtml(header)}</th>\n`;
    });
    
    html += '</tr>\n</thead>\n<tbody>\n';

    // Add data rows
    data.forEach(item => {
      html += '<tr>\n';
      headers.forEach(header => {
        const value = item[header];
        html += `<td>${this.escapeHtml(String(value || ''))}</td>\n`;
      });
      html += '</tr>\n';
    });

    html += '</tbody>\n</table>\n</body>\n</html>';
    return html;
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Format statistics for report
   */
  static formatStatistics(stats: any): string {
    let formatted = '=== STATISTICS SUMMARY ===\n\n';

    Object.keys(stats).forEach(key => {
      const value = stats[key];
      if (typeof value === 'object' && !Array.isArray(value)) {
        formatted += `${this.toTitleCase(key)}:\n`;
        Object.keys(value).forEach(subKey => {
          formatted += `  ${this.toTitleCase(subKey)}: ${value[subKey]}\n`;
        });
        formatted += '\n';
      } else {
        formatted += `${this.toTitleCase(key)}: ${value}\n`;
      }
    });

    return formatted;
  }

  /**
   * Convert string to title case
   */
  private static toTitleCase(str: string): string {
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Generate summary report in text format
   */
  static generateTextSummary(
    title: string,
    data: any,
    sections: Array<{ title: string; fields: string[] }>,
  ): string {
    let text = `${'='.repeat(60)}\n`;
    text += `${title.toUpperCase()}\n`;
    text += `${'='.repeat(60)}\n\n`;
    text += `Generated: ${new Date().toLocaleString()}\n\n`;

    sections.forEach(section => {
      text += `${'-'.repeat(60)}\n`;
      text += `${section.title}\n`;
      text += `${'-'.repeat(60)}\n`;

      section.fields.forEach(field => {
        const value = data[field];
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            text += `\n${this.toTitleCase(field)}:\n`;
            Object.keys(value).forEach(key => {
              text += `  ${this.toTitleCase(key)}: ${value[key]}\n`;
            });
          } else {
            text += `${this.toTitleCase(field)}: ${value}\n`;
          }
        }
      });

      text += '\n';
    });

    return text;
  }

  /**
   * Generate JSON report with metadata
   */
  static generateJsonReport(data: any, metadata?: any): string {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        ...metadata,
      },
      data,
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Calculate percentage with formatting
   */
  static formatPercentage(value: number, total: number, decimals: number = 2): string {
    if (total === 0) return '0.00%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * Format currency (Kenyan Shillings)
   */
  static formatCurrency(amount: number): string {
    // Convert from minor units (cents) to major units
    const majorAmount = amount / 100;
    return `KES ${majorAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (format === 'long') {
      return d.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    
    return d.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Generate compliance report summary
   */
  static generateComplianceSummary(report: any): string {
    let summary = `COMPLIANCE REPORT SUMMARY\n`;
    summary += `${'='.repeat(60)}\n\n`;
    summary += `Report Type: ${report.reportType}\n`;
    summary += `Period: ${report.reportPeriod}\n`;
    summary += `Status: ${report.status}\n`;
    summary += `Generated: ${this.formatDate(report.createdAt, 'long')}\n\n`;

    if (report.reportData) {
      summary += `KEY METRICS\n`;
      summary += `${'-'.repeat(60)}\n`;
      
      const data = report.reportData;
      if (data.summary) {
        Object.keys(data.summary).forEach(key => {
          summary += `${this.toTitleCase(key)}: ${data.summary[key]}\n`;
        });
      }
    }

    return summary;
  }

  /**
   * Generate audit report summary
   */
  static generateAuditSummary(audit: any): string {
    let summary = `DATA QUALITY AUDIT REPORT\n`;
    summary += `${'='.repeat(60)}\n\n`;
    summary += `Audit Type: ${audit.auditType}\n`;
    summary += `Date: ${this.formatDate(audit.createdAt, 'long')}\n`;
    summary += `Status: ${audit.status}\n\n`;

    summary += `QUALITY SCORES\n`;
    summary += `${'-'.repeat(60)}\n`;
    summary += `Overall Score: ${audit.overallScore}%\n`;
    summary += `Completeness: ${audit.completeness}%\n`;
    summary += `Accuracy: ${audit.accuracy}%\n`;
    summary += `Consistency: ${audit.consistency}%\n\n`;

    summary += `ISSUES FOUND\n`;
    summary += `${'-'.repeat(60)}\n`;
    summary += `Total Issues: ${audit.issuesFound}\n`;
    summary += `Critical: ${audit.criticalIssues}\n`;
    summary += `Warnings: ${audit.warningIssues}\n`;

    return summary;
  }

  /**
   * Generate grade distribution chart (ASCII)
   */
  static generateGradeDistributionChart(distribution: Record<string, number>): string {
    let chart = 'GRADE DISTRIBUTION\n';
    chart += `${'-'.repeat(60)}\n`;

    const maxCount = Math.max(...Object.values(distribution));
    const barWidth = 40;

    Object.keys(distribution).sort().forEach(grade => {
      const count = distribution[grade];
      const barLength = maxCount > 0 ? Math.floor((count / maxCount) * barWidth) : 0;
      const bar = '█'.repeat(barLength);
      chart += `${grade.padEnd(3)} | ${bar} ${count}\n`;
    });

    return chart;
  }

  /**
   * Generate attendance trend visualization (ASCII)
   */
  static generateAttendanceTrend(dailyStats: Array<{ date: string; present: number; total: number }>): string {
    let trend = 'ATTENDANCE TREND\n';
    trend += `${'-'.repeat(60)}\n`;
    trend += `Date         | Present | Total | Rate\n`;
    trend += `${'-'.repeat(60)}\n`;

    dailyStats.forEach(stat => {
      const rate = stat.total > 0 ? ((stat.present / stat.total) * 100).toFixed(1) : '0.0';
      trend += `${stat.date} | ${String(stat.present).padStart(7)} | ${String(stat.total).padStart(5)} | ${rate}%\n`;
    });

    return trend;
  }
}
