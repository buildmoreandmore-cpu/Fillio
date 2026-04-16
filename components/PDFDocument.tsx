import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf
} from '@react-pdf/renderer';
import type { PFSData } from '../types';

// Register fonts (using system fonts)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    borderBottom: '2px solid #0B2820',
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B2820',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 10,
  },
  confidential: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  infoBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0B2820',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 8,
    color: '#64748b',
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  descriptionCell: {
    flex: 3,
    paddingRight: 10,
  },
  valueCell: {
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    borderTop: '2px solid #0B2820',
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: {
    flex: 3,
    fontWeight: 'bold',
    fontSize: 11,
  },
  totalValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 11,
    color: '#0B2820',
  },
  summarySection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0B2820',
    marginBottom: 15,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottom: '1px solid #e2e8f0',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  netWorthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    marginTop: 5,
  },
  netWorthLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0B2820',
  },
  netWorthValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 15,
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    transform: 'rotate(-45deg)',
    fontSize: 60,
    color: '#f1f5f9',
    fontWeight: 'bold',
    opacity: 0.5,
  },
});

interface PFSDocumentProps {
  data: PFSData;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const PFSDocument: React.FC<PFSDocumentProps> = ({ data }) => {
  // Calculate totals
  const totalCash = data.cashAssets.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalInvestments = data.investmentAssets.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalRealEstateAssets = data.realEstateAssets.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalAssets = totalCash + totalInvestments + totalRealEstateAssets;

  const totalRealEstateLiabilities = data.realEstateLiabilities.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalOtherLiabilities = data.otherLiabilities.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalLiabilities = totalRealEstateLiabilities + totalOtherLiabilities;

  const netWorth = totalAssets - totalLiabilities;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Personal Financial Statement</Text>
          <Text style={styles.confidential}>Strictly Confidential</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Prepared For</Text>
              <Text style={styles.infoValue}>{data.fullName || 'N/A'}</Text>
            </View>
            <View style={[styles.infoBox, { textAlign: 'right' }]}>
              <Text style={styles.infoLabel}>As Of Date</Text>
              <Text style={styles.infoValue}>{data.asOfDate ? formatDate(data.asOfDate) : 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Section I: Assets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Section I: Assets</Text>
          </View>

          {/* Cash & Bank Accounts */}
          {data.cashAssets.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={[styles.sectionSubtitle, { marginBottom: 5 }]}>Cash & Bank Accounts</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.descriptionCell, styles.tableHeaderText]}>Description</Text>
                  <Text style={[styles.valueCell, styles.tableHeaderText]}>Value</Text>
                </View>
                {data.cashAssets.filter(item => item.description || item.value).map((item, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.descriptionCell}>{item.description || 'Cash Asset'}</Text>
                    <Text style={styles.valueCell}>{formatCurrency(item.value || 0)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalCash)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Investments */}
          {data.investmentAssets.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={[styles.sectionSubtitle, { marginBottom: 5 }]}>Investments & Retirement</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.descriptionCell, styles.tableHeaderText]}>Description</Text>
                  <Text style={[styles.valueCell, styles.tableHeaderText]}>Value</Text>
                </View>
                {data.investmentAssets.filter(item => item.description || item.value).map((item, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.descriptionCell}>{item.description || 'Investment'}</Text>
                    <Text style={styles.valueCell}>{formatCurrency(item.value || 0)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalInvestments)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Real Estate Assets */}
          {data.realEstateAssets.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={[styles.sectionSubtitle, { marginBottom: 5 }]}>Real Estate Assets</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.descriptionCell, styles.tableHeaderText]}>Description</Text>
                  <Text style={[styles.valueCell, styles.tableHeaderText]}>Value</Text>
                </View>
                {data.realEstateAssets.filter(item => item.description || item.value).map((item, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.descriptionCell}>{item.description || 'Real Estate'}</Text>
                    <Text style={styles.valueCell}>{formatCurrency(item.value || 0)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalRealEstateAssets)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Total Assets */}
          <View style={[styles.totalRow, { borderTop: '3px solid #0B2820', paddingTop: 15 }]}>
            <Text style={[styles.totalLabel, { fontSize: 12 }]}>TOTAL ASSETS</Text>
            <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(totalAssets)}</Text>
          </View>
        </View>

        {/* Section II: Liabilities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Section II: Liabilities</Text>
          </View>

          {/* Real Estate Liabilities */}
          {data.realEstateLiabilities.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={[styles.sectionSubtitle, { marginBottom: 5 }]}>Real Estate Mortgages</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.descriptionCell, styles.tableHeaderText]}>Description</Text>
                  <Text style={[styles.valueCell, styles.tableHeaderText]}>Balance</Text>
                </View>
                {data.realEstateLiabilities.filter(item => item.description || item.value).map((item, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.descriptionCell}>{item.description || 'Mortgage'}</Text>
                    <Text style={styles.valueCell}>{formatCurrency(item.value || 0)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalRealEstateLiabilities)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Other Liabilities */}
          {data.otherLiabilities.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={[styles.sectionSubtitle, { marginBottom: 5 }]}>Other Liabilities & Debts</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.descriptionCell, styles.tableHeaderText]}>Description</Text>
                  <Text style={[styles.valueCell, styles.tableHeaderText]}>Balance</Text>
                </View>
                {data.otherLiabilities.filter(item => item.description || item.value).map((item, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.descriptionCell}>{item.description || 'Liability'}</Text>
                    <Text style={styles.valueCell}>{formatCurrency(item.value || 0)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalOtherLiabilities)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Total Liabilities */}
          <View style={[styles.totalRow, { borderTop: '3px solid #0B2820', paddingTop: 15 }]}>
            <Text style={[styles.totalLabel, { fontSize: 12 }]}>TOTAL LIABILITIES</Text>
            <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(totalLiabilities)}</Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Financial Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Assets</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalAssets)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Liabilities</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalLiabilities)}</Text>
          </View>
          <View style={styles.netWorthRow}>
            <Text style={styles.netWorthLabel}>NET WORTH</Text>
            <Text style={[styles.netWorthValue, netWorth < 0 && { color: '#dc2626' }]}>
              {formatCurrency(netWorth)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by BankReadyDocs • {new Date().toLocaleDateString()}</Text>
          <Text style={{ marginTop: 3 }}>This document is for informational purposes only.</Text>
        </View>
      </Page>
    </Document>
  );
};

// Function to generate PDF blob
export const generatePDFBlob = async (data: PFSData): Promise<Blob> => {
  const doc = <PFSDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
};

// Function to download PDF
export const downloadPDF = async (data: PFSData, filename?: string): Promise<void> => {
  const blob = await generatePDFBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `PFS_${data.fullName?.replace(/\s+/g, '_') || 'Document'}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default PFSDocument;
